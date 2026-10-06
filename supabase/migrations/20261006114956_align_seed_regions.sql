-- Match seeded college regions to the app's PH address dataset (src/data/ph-address.ts).
update public.colleges set region = 'National Capital Region (NCR)' where region = 'NCR - National Capital Region';
update public.colleges set region = 'Region VII (Central Visayas)' where region = 'Region VII - Central Visayas';
update public.colleges set region = 'Region XI (Davao Region)' where region = 'Region XI - Davao Region';
