import { supabase } from '../../../lib/supabase';
import { matchOut, matchIn } from '../../../lib/map';

export async function GET() {
  const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(matchOut));
}

export async function POST(req) {
  const body = await req.json();
  if (!body.entryAId || !body.entryBId) {
    return Response.json({ error: 'Both entries are required.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('matches').insert(matchIn(body)).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(matchOut(data), { status: 201 });
}
