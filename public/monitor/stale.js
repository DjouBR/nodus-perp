/**
 * public/monitor/stale.js — Tela 2 (monitor dos atletas)
 *
 * Pinta de cinza o card do atleta que deixou de receber dados.
 * Regra: sem mensagem ha mais de STALE_MS OU frequencia cardiaca = 0.
 * Quando chega dado novo, updateCard() do index.html devolve a cor da zona.
 *
 * Carregado pelo route.js de /monitor/[token] (injetado antes de </body>).
 * Usa as variaveis globais athletes (Map) definidas no index.html.
 */
(function () {
  var STALE_MS = 10000
  var GRAY = 'rgba(97, 97, 97, 0.7)'

  setInterval(function () {
    if (typeof athletes === 'undefined') return
    var now = Date.now()
    athletes.forEach(function (st) {
      var card = document.getElementById('card-' + st.athleteId)
      if (!card) return
      var stale = !st.heartRate || now - st.lastSeen > STALE_MS
      card.classList.toggle('is-stale', stale)
      if (stale) {
        card.style.backgroundColor = GRAY
        card.querySelectorAll('.circle-progress').forEach(function (el) {
          el.style.stroke = '#9e9e9e'
        })
      }
    })
  }, 1000)
})()
