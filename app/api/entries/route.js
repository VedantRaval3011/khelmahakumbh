import { supabase } from '../../../lib/supabase';
import { entryOut, entryIn } from '../../../lib/map';

export async function GET() {
  const { data, error } = await supabase.from('entries').select('*');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(entryOut));
}

export async function POST(req) {
  const body = await req.json();
  const { data, error } = await supabase.from('entries').insert(entryIn(body)).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(entryOut(data), { status: 201 });
}
