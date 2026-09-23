// Laur’Appui V5.41 — Liens Stripe Payment Links
// Remplacez les valeurs vides par vos liens https://buy.stripe.com/...
window.LAURAPPUI_PAYMENTS = {
  diagnostic: "",
  sereniteBudget: "",
  vipTrimestriel: "",
  vipAnnuel: ""
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-payment]").forEach(btn => {
    const consent = btn.parentElement && btn.parentElement.querySelector(".cgv-check-v543");
    const url = window.LAURAPPUI_PAYMENTS[btn.dataset.payment];
    if (consent && !consent.checked) btn.classList.add("is-cgv-locked");
    if (consent) consent.addEventListener("change", () => btn.classList.toggle("is-cgv-locked", !consent.checked));
    if (url) {
      btn.href = url; btn.target = "_blank"; btn.rel = "noopener";
      btn.addEventListener("click", e => { if (consent && !consent.checked) { e.preventDefault(); alert("Veuillez lire et accepter les Conditions Générales de Vente avant de poursuivre vers le paiement."); } });
    } else {
      btn.href = "#"; btn.classList.add("is-disabled");
      btn.addEventListener("click", e => {
        e.preventDefault();
        if (consent && !consent.checked) { alert("Veuillez lire et accepter les Conditions Générales de Vente avant de poursuivre vers le paiement."); return; }
        alert("Le paiement en ligne de cette formule sera disponible dès l’activation du lien de paiement sécurisé.");
      });
    }
  });
});
