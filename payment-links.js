// Laur’Appui — préparation Stripe V4 (aucun encaissement actif)
// Renseigner les liens/checkout Stripe uniquement après ouverture et configuration du compte.
window.LAURAPPUI_PAYMENTS = {
  diagnostic_comptant: "", diagnostic_3x: "", diagnostic_4x: "",
  sereniteBudget_comptant: "", sereniteBudget_3x: "", sereniteBudget_4x: "",
  vipTrimestriel_comptant: "", vipTrimestriel_3x: "", vipTrimestriel_4x: "",
  vipAnnuel_comptant: "", vipAnnuel_3x: "", vipAnnuel_4x: "", vipAnnuel_12x: ""
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
      if (!url) { e.preventDefault(); alert("Cette option de paiement sera disponible après l’activation du compte Stripe Laur’Appui."); }
    });
  });
});
