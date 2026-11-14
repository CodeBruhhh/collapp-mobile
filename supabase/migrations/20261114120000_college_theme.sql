-- Brand colours for a college's public page. The app picks a primary,
-- secondary and accent colour from the logo; representatives can adjust them.
-- `source` records whether they still follow the logo ('logo') or were edited
-- ('custom'); `palette` keeps the logo's other colours as quick choices.
-- Null means the page uses CollApp's own colours. Reps already update their
-- own college under the existing RLS policy and table grant.

alter table public.colleges
  add column theme jsonb
  constraint colleges_theme_shape check (
    theme is null
    or (
      jsonb_typeof(theme) = 'object'
      and coalesce(theme ->> 'primary', '') ~ '^#[0-9A-Fa-f]{6}$'
      and coalesce(theme ->> 'secondary', '') ~ '^#[0-9A-Fa-f]{6}$'
      and coalesce(theme ->> 'accent', '') ~ '^#[0-9A-Fa-f]{6}$'
      and coalesce(theme ->> 'source', 'logo') in ('logo', 'custom')
      and (
        not theme ? 'palette'
        or (jsonb_typeof(theme -> 'palette') = 'array' and jsonb_array_length(theme -> 'palette') <= 8)
      )
    )
  );

comment on column public.colleges.theme is
  'Page colours {primary, secondary, accent: "#RRGGBB", source: "logo"|"custom", palette?: ["#RRGGBB"]}; null = CollApp default.';
