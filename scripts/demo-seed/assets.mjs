// School logos and campus photos from Wikipedia / Wikimedia Commons.
// Only image bytes are used; anything that isn't a PNG/JPEG under 5 MB is rejected.

const UA = 'CollAppDemoSeed/1.0 (school project demo data)';
const MAX_BYTES = 5 * 1024 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wikimedia rate-limits bursts: space requests out and back off on 429. */
async function politeFetch(url, headers) {
  for (let attempt = 0; ; attempt++) {
    await sleep(1500);
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
    if (res.status !== 429 || attempt >= 4) return res;
    const wait = Number(res.headers.get('retry-after')) || 5 * 2 ** attempt;
    await sleep(wait * 1000);
  }
}

async function getJson(url) {
  const res = await politeFetch(url, { Accept: 'application/json' });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

/** Download an image, checking its real type from the file's first bytes. */
async function getImage(url) {
  const res = await politeFetch(url, {});
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`Image too large: ${url}`);
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!png && !jpeg) throw new Error(`Not a PNG or JPEG: ${url}`);
  return { bytes, mime: png ? 'image/png' : 'image/jpeg', ext: png ? 'png' : 'jpg', source: url };
}

/** Try a larger standard thumbnail width first, then the URL as given. */
async function getThumb(thumbUrl, width) {
  const bigger = thumbUrl.replace(/\/(\d+)px-/, `/${width}px-`);
  if (bigger !== thumbUrl) {
    try {
      return await getImage(bigger);
    } catch {
      // Not offered at that width (e.g. the original is smaller); use the given one.
    }
  }
  return getImage(thumbUrl);
}

const NOT_A_PHOTO = /logo|seal|emblem|coat_of_arms|flag|map|icon|locator|marker|\.svg|\.gif|\.webp/i;

/** First matching photo on Wikimedia Commons for a search, as a 1280px JPEG thumbnail. */
async function commonsPhoto(search) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(search)}` +
    '&prop=imageinfo&iiprop=url|mime&iiurlwidth=1280';
  const data = await getJson(url);
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const hit = pages.find(
    (p) => !NOT_A_PHOTO.test(p.title) && p.imageinfo?.[0]?.mime === 'image/jpeg',
  );
  if (!hit) return null;
  return { title: hit.title, image: await getImage(hit.imageinfo[0].thumburl) };
}

/** A specific Commons file (e.g. "File:UC-Main.jpg") as a 1280px JPEG thumbnail. */
async function commonsFile(title) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1280`;
  const data = await getJson(url);
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info || info.mime !== 'image/jpeg') return null;
  return { title, image: await getImage(info.thumburl) };
}

/**
 * The article's lead image (its logo or seal) and a campus photo: a pinned Commons
 * file (`photoCommons`) or article file (`photoFile`), else a Commons search
 * (`photoSearch`), else the article's first photo.
 */
export async function schoolAssets({ wiki, photoFile, photoCommons, photoSearch }) {
  const title = encodeURIComponent(wiki);
  const summary = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
  const media = await getJson(`https://en.wikipedia.org/api/rest_v1/page/media-list/${title}`);
  const images = (media.items ?? []).filter((i) => i.type === 'image' && i.srcset?.length);
  const thumbOf = (item) => {
    const src = item.srcset[item.srcset.length - 1].src;
    return src.startsWith('//') ? `https:${src}` : src;
  };

  const logo = summary.thumbnail?.source ? await getThumb(summary.thumbnail.source, 500) : null;

  let photo = null;
  let photoTitle = null;
  if (photoCommons) {
    const found = await commonsFile(photoCommons);
    if (found) ({ image: photo, title: photoTitle } = found);
  }
  // A search (for a present-day campus photo) wins over the article's first photo.
  if (!photo && photoSearch && !photoFile) {
    const found = await commonsPhoto(photoSearch);
    if (found) ({ image: photo, title: photoTitle } = found);
  }
  if (!photo) {
    const item = photoFile
      ? images.find((i) => i.title === `File:${photoFile}`)
      : images.find((i) => !NOT_A_PHOTO.test(i.title) && /\.(jpe?g)$/i.test(i.title));
    if (item) {
      photo = await getThumb(thumbOf(item), 1280);
      photoTitle = item.title;
    }
  }

  return { logo, photo, photoTitle, candidates: images.map((i) => i.title) };
}
