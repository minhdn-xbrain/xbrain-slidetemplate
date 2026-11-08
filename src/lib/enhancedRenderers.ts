// @ts-nocheck
// Enhanced renderers are optional; the SVG fallback remains available offline and in print.
export const EnhancedRenderers = (() => {
  function dispose(scope) {
    if (typeof window === 'undefined' || !window.echarts) return;
    scope.querySelectorAll('.v1-library.v1-echarts .v1-enhanced').forEach(target => {
      const chart = window.echarts.getInstanceByDom(target);
      if (chart) chart.dispose();
    });
  }
  function mount(scope = typeof document !== 'undefined' ? document : null) {
    if (!scope || typeof window === 'undefined') return;
    if (scope !== document && scope.id !== 'active-slide-viewport') return;
    if (window.echarts) {
      scope.querySelectorAll('.v1-library.v1-echarts').forEach(el => {
        try {
          const target = el.querySelector('.v1-enhanced');
          if (target.dataset.ready) return;
          const option = JSON.parse(decodeURIComponent(el.dataset.option));
          if (!option.series && !option.dataset) return;
          target.style.cssText = 'position:absolute;inset:0;background:#fff';
          const chart = window.echarts.init(target, null, { renderer: 'svg' });
          chart.setOption(option);
          target.dataset.ready = '1';
          el.querySelector('.v1-fallback').style.display = 'none';
        } catch (error) {
          console.warn('ECharts fallback', error);
        }
      });
    }
    if (window.mermaid?.render) {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        suppressErrorRendering: true,
        theme: 'base',
        themeVariables: {
          primaryColor: '#F97C00',
          primaryTextColor: '#425453',
          primaryBorderColor: '#E46325',
          lineColor: '#25AC9D',
          secondaryColor: '#E5F4EF',
          tertiaryColor: '#FFF5ED',
          edgeLabelBackground: '#FFFFFF',
          textColor: '#425453',
          fontFamily: 'Nunito, Arial, sans-serif',
        },
      });
      scope.querySelectorAll('.v1-library.v1-mermaid').forEach(async el => {
        const target = el.querySelector('.v1-enhanced');
        if (!target || !el.dataset.source || target.dataset.ready) return;
        target.dataset.ready = 'loading';
        const id = 'xbm' + Math.random().toString(36).slice(2);
        try {
          const source = decodeURIComponent(el.dataset.source);
          const { svg } = await window.mermaid.render(id, source);
          if (!target.isConnected || !scope.contains(target)) return;
          target.innerHTML = svg;
          target.dataset.ready = '1';
          el.querySelector('.v1-fallback').style.display = 'none';
        } catch (error) {
          target.dataset.ready = 'failed';
          document.getElementById('d' + id)?.remove();
          console.warn('Mermaid fallback', error);
        }
      });
    }
  }
  return { mount, dispose };
})();
