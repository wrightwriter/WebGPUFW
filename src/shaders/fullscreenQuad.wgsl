
struct VSOut {
  @builtin(position) Position: v4,
  @location(0) uv: v2,
}


@vertex
fn main(
  @location(0) inPos: v2,
) -> VSOut {
  var O: VSOut;

  // O.Position = v4(z + v3(0.,0.,0.), 1.);
  O.Position = v4(inPos.xy, 0., 1.) ;

  // O.col = inCol;
  O.uv = inPos.xy;

  return O;
}