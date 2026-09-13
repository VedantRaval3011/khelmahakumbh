import { supabase } from '../../../lib/supabase';
import { teamOut, teamIn } from '../../../lib/map';

export async function GET() {
  const { data, error } = await supabase.from('teams').select('*');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(teamOut));
}

export async function POST(req) {
  const body = await req.json();
  if (!body.player1Id || !body.player2Id || body.player1Id === body.player2Id) {
    return Response.json({ error: 'Pick two different players.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('teams').insert(teamIn(body)).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(teamOut(data), { status: 201 });
}
