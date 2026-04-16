export const NextResponse = {
  json(payload: unknown, init?: ResponseInit) {
    return Response.json(payload, init);
  },
};
