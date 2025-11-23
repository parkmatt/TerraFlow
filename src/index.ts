import "./styles/index.css";
import "./styles/terraflowsettings.css";
import "antd/dist/reset.css";
import TerraFlowRouter from "@/router/TerraFlowRouter";
import $ from "jquery";
window.$ = $;
$(function () {
  
  // Only initialize TerraFlow on Terrain pages
  const isTerrainPage = () => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check if we're on terrain.scouts.com.au and not on login page
    return hostname.includes('terrain.scouts.com.au') && 
           !pathname.includes('/login') && 
           !pathname.includes('/auth') &&
           !pathname.includes('/register') &&
           !pathname.includes('/password') &&
           pathname !== '/' &&
           pathname !== '';
  };

  // Also listen for route changes to initialize when navigating to valid pages
  const initializeOnValidPage = () => {
    if (isTerrainPage()) {
      console.log('TerraFlow: Valid page detected, initializing...');
      
      // Wait for the DOM and Vue components to be fully loaded
      if (window.$nuxt && window.$nuxt.$nextTick) {
        window.$nuxt.$nextTick(() => {
          setTimeout(() => {
            const terraFlowRouter = TerraFlowRouter.getInstance();
            terraFlowRouter.finaliseSetup();
          }, 1000);
        });
      } else {
        // Fallback if $nuxt not available
        setTimeout(() => {
          const terraFlowRouter = TerraFlowRouter.getInstance();
          terraFlowRouter.finaliseSetup();
        }, 2000);
      }
    }
  };

  // Handle SPA navigation: initialize on Terrain pages, destroy when leaving to login/auth
  const handleSpaNavigation = () => {
    if (isTerrainPage()) {
      initializeOnValidPage();
    } else {
      try {
        TerraFlowRouter.destroyInstance();
        console.log('TerraFlow: Destroyed due to navigation to non-Terrain page');
      } catch (e) {
        // ignore
      }
    }
  };
  // Always ensure SPA navigation hooks are present so we can detect logout/navigation
  // away from Terrain whether TerraFlow was initialized on page load or later.
  (function ensureSpaHooks() {
    try {
      // Avoid double-wrapping
      if ((window as any).__terraflow_history_wrapped) return;
      const _wr = (type: 'pushState' | 'replaceState') => {
        const orig = (history as any)[type];
        return function(this: any, ...args: any[]) {
          const res = orig.apply(this, args);
          window.dispatchEvent(new Event('locationchange'));
          return res;
        };
      };
      (history as any).pushState = _wr('pushState');
      (history as any).replaceState = _wr('replaceState');
      window.addEventListener('popstate', handleSpaNavigation);
      window.addEventListener('locationchange', handleSpaNavigation as EventListener);
      (window as any).__terraflow_history_wrapped = true;

      // Also check periodically in case navigation happens without history events
      const checkInterval = setInterval(() => {
        if (isTerrainPage()) {
          clearInterval(checkInterval);
          initializeOnValidPage();
        }
      }, 2000);
      // Stop checking after 2 minutes
      setTimeout(() => clearInterval(checkInterval), 120000);
    } catch (e) {
      console.warn('TerraFlow: failed to install SPA hooks', e);
    }
  })();

  console.log('TerraFlow: On valid Terrain page, initializing immediately...');
  
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

  // Add global functions for manual testing/debugging
  (window as any).terraflowDebug = {
    isTerrainPage: () => {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      console.log('Current URL:', window.location.href);
      console.log('Hostname:', hostname);
      console.log('Pathname:', pathname);
      return hostname.includes('terrain.scouts.com.au') && 
             !pathname.includes('/login') && 
             !pathname.includes('/auth') &&
             !pathname.includes('/register') &&
             !pathname.includes('/password') &&
             pathname !== '/' &&
             pathname !== '';
    },
    initializeTerraFlow: () => {
      console.log('Manual TerraFlow initialization...');
      const terraFlowRouter = TerraFlowRouter.getInstance();
      terraFlowRouter.finaliseSetup();
    },
    resetTerraFlow: () => {
      console.log('Manual TerraFlow reset...');
      const terraFlowRouter = TerraFlowRouter.getInstance();
      terraFlowRouter.resetMenu();
      setTimeout(() => terraFlowRouter.finaliseSetup(), 1000);
    }
  };
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
