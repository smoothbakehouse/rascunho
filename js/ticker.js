/*
window.addEventListener("load", () => {
  const track = document.querySelector(".ticker-track");
  const first = track?.querySelector(".ticker-content");
  if (!track || !first) return;

  const width = first.offsetWidth;

  track.style.setProperty("--ticker-width", `${width}px`);
  track.style.animationDuration = `${width / 12}s`;
});
*/

window.addEventListener("load", () => {
  const track = document.querySelector(".ticker-track");
  const items = track?.querySelectorAll(".ticker-content");
  if (!track || !items || !items.length) return;

  let tickerText = "";

  // loja aberta → ticker original
  if (typeof isStoreOpenNow === "function" && isStoreOpenNow()) {
    tickerText = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Atendimento: Seg. à Sex. 10:00 às 23:00 hrs &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; Sáb. Dom. 16:00 às 23:00 hrs &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; Delivery & Retiradas";
  }
  // loja fechada → mesmo texto longo em todos os blocos
  else {
    tickerText = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;No momento estamos fora do horário de atendimento &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;  Em breve será um prazer atender você &nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp; No momento estamos fora do horário de atendimento &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;  Em breve será um prazer atender você"
  }

  items.forEach(item => {
    item.innerHTML = tickerText;
  });

  const first = track.querySelector(".ticker-content");
  if (!first) return;

  const width = first.offsetWidth;

  track.style.setProperty("--ticker-width", `${width}px`);
  track.style.animationDuration = `${width / 12}s`;
});