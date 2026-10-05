// Laur’Appui — liens de paiement Stripe actifs
// Le fractionnement éventuel (PayPal, Scalapay, etc.) est proposé par le prestataire selon l’éligibilité du client.
window.LAURAPPUI_PAYMENTS = {
  diagnostic: "https://buy.stripe.com/28EbJ0ajf0La7FAdi31ck00",
  sereniteBudget: "https://buy.stripe.com/4gM6oG4YVgK85xsb9V1ck01",
  vipTrimestriel: "https://buy.stripe.com/8x28wO2QNfG4e3Y4Lx1ck02",
  vipAnnuel: "https://buy.stripe.com/00w5kC9fb9hG7FA2Dp1ck03"
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-payment]").forEach(btn => {
    const box = btn.closest(".payment-actions-v541") || btn.parentElement;
    const consent = box && box.querySelector(".cgv-check-v543");
    const url = window.LAURAPPUI_PAYMENTS[btn.dataset.payment];
    if (consent && !consent.checked) btn.classList.add("is-cgv-locked");
    if (consent) consent.addEventListener("change", () => btn.classList.toggle("is-cgv-locked", !consent.checked));
    btn.href = url || "#";
    if (url) { btn.target="_blank"; btn.rel="noopener"; } else btn.classList.add("is-disabled");
    btn.addEventListener("click", e => {
      if (consent && !consent.checked) { e.preventDefault(); alert("Veuillez lire et accepter les Conditions Générales de Vente avant de poursuivre vers le paiement."); return; }
      if (!url) { e.preventDefault(); alert("Le lien de paiement est momentanément indisponible."); }
    });
  });
});
