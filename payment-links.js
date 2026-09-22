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
    const url = window.LAURAPPUI_PAYMENTS[btn.dataset.payment];
    if (url) {
      btn.href = url; btn.target = "_blank"; btn.rel = "noopener";
    } else {
      btn.href = "#"; btn.classList.add("is-disabled");
      btn.addEventListener("click", e => {
        e.preventDefault();
        alert("Le paiement en ligne de cette formule sera disponible dès l’activation du lien de paiement sécurisé.");
      });
    }
  });
});
