function iniciarTutorialAdm() {
  const jaViu = localStorage.getItem("tutorialAdmVisto");
  if (jaViu) return;

  const observer = new MutationObserver(() => {
    const botaoCobranca = document.querySelector('button[onclick^="adicionarCobrancaPix"]');
    const botoesAcoes = document.querySelectorAll('.boleto-acoes button');

    if (botaoCobranca && botoesAcoes.length >= 3) {
      observer.disconnect();
      introJs().setOptions({
        steps: [
          {
            element: botaoCobranca,
            intro: "Aqui você pode gerar uma nova cobrança Pix para o usuário.",
          },
          {
            element: botoesAcoes[0],
            intro: "Este botão permite editar a cobrança.",
          },
          {
            element: botoesAcoes[1],
            intro: "Marque a cobrança como paga por aqui.",
          },
          {
            element: botoesAcoes[2],
            intro: "E aqui você pode excluir a cobrança.",
          }
        ]
      }).start();

      localStorage.setItem("tutorialAdmVisto", "true");
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
    iniciarTutorialAdm();