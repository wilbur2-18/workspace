(function () {
  if (!window.__DGP_APP) {
    console.error('[demo-boot] __DGP_APP is missing');
    return;
  }
  window.__DGP_APP.use(antd).mount('#app');
})();
