require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file first.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { count } = await supabase.from('people').select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log('Database already has people — skipping seed. Clear the tables manually if you want to reseed.');
    return;
  }

  async function P(name, gender, ageGroup, notes) {
    const { data, error } = await supabase.from('people')
      .insert({ name, gender, age_group: ageGroup, area_type: 'DISTRICT', notes: notes || '' })
      .select().single();
    if (error) throw error;
    return data;
  }

  const jayshree = await P('Jayshree Ben', 'F', 'OPEN');
  const trupti = await P('Trupti Bhatt', 'F', 'OPEN');
  const twisha = await P('Twisha Adhiya', 'F', 'OPEN');
  const tanvi = await P('Tanvi', 'F', 'OPEN');
  const himish = await P('Himish', 'M', 'OPEN');
  const tarang = await P('Tarang Bhatt', 'M', 'OPEN');
  const siddharth = await P('Siddharth Bhai', 'M', 'OPEN');
  const siddharthWife = await P("Siddharth Bhai's wife", 'F', 'OPEN', 'Name pending — update this record when known.');
  const anand = await P('Anand Bhai', 'M', '40PLUS');
  const anandWife = await P("Anand Bhai's wife", 'F', '40PLUS', 'Name pending — update this record when known.');
  const montu = await P('Montu Bhai', 'M', '40PLUS');
  const montuWife = await P("Montu Bhai's wife", 'F', '40PLUS', 'Name pending — update this record when known.');
  const hitenWife = await P("Hiten Bhai's wife", 'F', '40PLUS', 'Name pending — update this record when known.');
  const jiga = await P('Jiga Bhai', 'M', '40PLUS');
  const jigaWife = await P("Jiga Bhai's wife", 'F', '40PLUS', 'Name pending — update this record when known.');
  const shreyas = await P('Shreyas Bhai', 'M', '40PLUS');
  const shreyasWife = await P("Shreyas Bhai's wife", 'F', '40PLUS', 'Name pending — update this record when known.');

  async function T(p1, p2) {
    const { data, error } = await supabase.from('teams')
      .insert({ player1_id: p1.id, player2_id: p2.id }).select().single();
    if (error) throw error;
    return data;
  }
  const tWD1 = await T(trupti, tanvi);
  const tWD2 = await T(twisha, siddharthWife);
  const tWM1 = await T(himish, jayshree);
  const tWM2 = await T(tarang, trupti);
  const tWM3 = await T(siddharth, siddharthWife);
  const t40M1 = await T(anand, anandWife);
  const t40M2 = await T(shreyas, shreyasWife);
  const t40M3 = await T(montu, montuWife);
  const t40M4 = await T(jiga, jigaWife);

  async function E(areaType, ageGroup, eventType, participantType, participant, status) {
    const { data, error } = await supabase.from('entries').insert({
      area_type: areaType, age_group: ageGroup, event_type: eventType,
      participant_type: participantType, participant_id: participant ? participant.id : null, status,
    }).select().single();
    if (error) throw error;
    return data;
  }

  const jEntry = await E('DISTRICT', 'OPEN', 'WOMENS_SINGLES', 'PERSON', jayshree, 'CONFIRMED');
  const tEntry = await E('DISTRICT', 'OPEN', 'WOMENS_SINGLES', 'PERSON', trupti, 'CONFIRMED');
  await E('DISTRICT', 'OPEN', 'WOMENS_SINGLES', 'PERSON', twisha, 'CONFIRMED');

  await E('DISTRICT', 'OPEN', 'WOMENS_DOUBLES', 'TEAM', tWD1, 'CONFIRMED');
  await E('DISTRICT', 'OPEN', 'WOMENS_DOUBLES', 'TEAM', tWD2, 'CONFIRMED');
  await E('DISTRICT', 'OPEN', 'WOMENS_DOUBLES', 'TEAM', null, 'OPEN');

  const t1Entry = await E('DISTRICT', 'OPEN', 'WOMENS_MIXED', 'TEAM', tWM1, 'CONFIRMED');
  const t2Entry = await E('DISTRICT', 'OPEN', 'WOMENS_MIXED', 'TEAM', tWM2, 'CONFIRMED');
  await E('DISTRICT', 'OPEN', 'WOMENS_MIXED', 'TEAM', tWM3, 'CONFIRMED');
  await E('DISTRICT', 'OPEN', 'WOMENS_MIXED', 'TEAM', null, 'OPEN');

  await E('DISTRICT', '40PLUS', 'WOMENS_SINGLES', 'PERSON', anandWife, 'CONFIRMED');
  await E('DISTRICT', '40PLUS', 'WOMENS_SINGLES', 'PERSON', montuWife, 'CONFIRMED');
  await E('DISTRICT', '40PLUS', 'WOMENS_SINGLES', 'PERSON', hitenWife, 'CONFIRMED');
  await E('DISTRICT', '40PLUS', 'WOMENS_SINGLES', 'PERSON', jigaWife, 'CONFIRMED');

  await E('DISTRICT', '40PLUS', 'WOMENS_MIXED', 'TEAM', t40M1, 'CONFIRMED');
  await E('DISTRICT', '40PLUS', 'WOMENS_MIXED', 'TEAM', t40M2, 'CONFIRMED');
  await E('DISTRICT', '40PLUS', 'WOMENS_MIXED', 'TEAM', t40M3, 'TBD');
  await E('DISTRICT', '40PLUS', 'WOMENS_MIXED', 'TEAM', t40M4, 'CONFIRMED');

  const { error: m1err } = await supabase.from('matches').insert({
    area_type: 'DISTRICT', age_group: 'OPEN', event_type: 'WOMENS_SINGLES', round: 'Semifinal 1',
    entry_a_id: jEntry.id, entry_b_id: tEntry.id, winner_entry_id: jEntry.id,
    score: '21-18, 21-15', prize: 500,
  });
  if (m1err) throw m1err;

  const { error: m2err } = await supabase.from('matches').insert({
    area_type: 'DISTRICT', age_group: 'OPEN', event_type: 'WOMENS_MIXED', round: 'Final',
    entry_a_id: t1Entry.id, entry_b_id: t2Entry.id, winner_entry_id: t1Entry.id,
    score: '21-19, 19-21, 21-17', prize: 1000,
  });
  if (m2err) throw m2err;

  console.log('Seed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
