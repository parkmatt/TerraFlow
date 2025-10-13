import "./styles/index.css";
import "./styles/terraflowsettings.css";
import "antd/dist/reset.css";
import TerraFlowRouter from "@/router/TerraFlowRouter";
import $ from "jquery";
window.$ = $;
$(function () {
  
  // Wait for the DOM and Vue components to be fully loaded before initializing TerraFlow
  window.$nuxt.$nextTick(() => {
    setTimeout(() => {
      console.log('Initializing TerraFlow Router...');
      
      // Function to try initializing when nav component is ready
      const tryInitialize = (attempts = 0) => {
        if (attempts > 10) {
          console.warn('Failed to find Vue app after 10 attempts, proceeding anyway');
          const terraFlowRouter = TerraFlowRouter.getInstance();
          setTimeout(() => {
            terraFlowRouter.finaliseSetup();
          }, 1000);
          return;
        }
        
        const app = (window as any).app || (window as any).$nuxt || (window as any).__VUE__;
        if (!app) {
          console.log(`Vue app not found yet, attempt ${attempts + 1}/10`);
          setTimeout(() => tryInitialize(attempts + 1), 500);
          return;
        }
        
        // For Nuxt apps, the Vue instance might be in $nuxt
        const vueInstance = app.$children ? app : ((window as any).$nuxt && (window as any).$nuxt.$root);
        if (!vueInstance || !vueInstance.$children) {
          console.log(`Vue instance not ready yet, attempt ${attempts + 1}/10`);
          setTimeout(() => tryInitialize(attempts + 1), 500);
          return;
        }
        
        // Check if nav-menu component exists
        import('@/helpers/FindComponent').then(({ default: FindComponent }) => {
          const navComponent = FindComponent("NavMenu", vueInstance);
          
          if (navComponent) {
            const terraFlowRouter = TerraFlowRouter.getInstance();
            setTimeout(() => {
              terraFlowRouter.finaliseSetup();
            }, 500);
          } else {
            setTimeout(() => tryInitialize(attempts + 1), 500);
          }
        }).catch(() => {
          // Fallback if import fails
          const terraFlowRouter = TerraFlowRouter.getInstance();
          setTimeout(() => {
            terraFlowRouter.finaliseSetup();
          }, 1000);
        });
      };
      
      tryInitialize();
    }, 1000);
  });
  
  const Vue = window.$nuxt.$root && window.$nuxt.$root.constructor;
  window.Vue = Vue as never;
});

$.fn.xpath = function (expr) {
  const found = [];
  const context = this[0];
  const result = document.evaluate(expr, context, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  let node;
  while ((node = result.iterateNext())) {
    found.push(node);
  }
  return $(found);
};
