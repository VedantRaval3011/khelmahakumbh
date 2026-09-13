export function personOut(r) {
  return { id: r.id, name: r.name, gender: r.gender, ageGroup: r.age_group, areaType: r.area_type, notes: r.notes || '' };
}
export function personIn(body) {
  return {
    name: body.name.trim(),
    gender: body.gender || 'F',
    age_group: body.ageGroup || 'OPEN',
    area_type: body.areaType || 'DISTRICT',
    notes: body.notes || '',
  };
}

export function teamOut(r) {
  return { id: r.id, player1Id: r.player1_id, player2Id: r.player2_id };
}
export function teamIn(body) {
  return { player1_id: body.player1Id, player2_id: body.player2Id };
}

export function entryOut(r) {
  return {
    id: r.id, areaType: r.area_type, ageGroup: r.age_group, eventType: r.event_type,
    participantType: r.participant_type, participantId: r.participant_id, status: r.status,
  };
}
export function entryIn(body) {
  return {
    area_type: body.areaType, age_group: body.ageGroup, event_type: body.eventType,
    participant_type: body.participantType || 'PERSON', participant_id: body.participantId || null,
    status: body.status || 'CONFIRMED',
  };
}

export function matchOut(r) {
  return {
    id: r.id, areaType: r.area_type, ageGroup: r.age_group, eventType: r.event_type, round: r.round || '',
    entryAId: r.entry_a_id, entryBId: r.entry_b_id, winnerEntryId: r.winner_entry_id,
    score: r.score || '', prize: r.prize || 0,
  };
}
export function matchIn(body) {
  return {
    area_type: body.areaType, age_group: body.ageGroup, event_type: body.eventType, round: body.round || '',
    entry_a_id: body.entryAId, entry_b_id: body.entryBId, winner_entry_id: body.winnerEntryId || body.entryAId,
    score: body.score || '', prize: Number(body.prize) || 0,
  };
}
