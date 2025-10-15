import FindComponent from "../helpers/FindComponent";
import { TerraFlowCalendar } from "@/pages";
import { NavMenuComponent, NavMenuItem } from "@/types/NavMenu";
import VueRouter, { Route } from "vue-router";
import Vue from "vue";
import TerraFlowSettings from "@/pages/TerraFlowSettings/TerraFlowSettings.vue";

export default class TerraFlowRouter {
  private static instance: TerraFlowRouter;
  private router: VueRouter;
  private terraflowNavMenuItems: NavMenuItem[];
  private static terrainNavMenuItems: NavMenuItem[];

  constructor() {
    // Get Terrain's router from multiple possible locations
    const app = (window as any).app;
    const nuxt = (window as any).$nuxt;
    
    this.router = app?.$router || nuxt?.$router || new VueRouter();
    this.terraflowNavMenuItems = [];
    TerraFlowRouter.terrainNavMenuItems = TerraFlowRouter.getTerrainNavMenuItems();
    this.initRoutes();
    this.initNavMenu();
  }

  public static getInstance(): TerraFlowRouter {
    if (!TerraFlowRouter.instance) {
      TerraFlowRouter.instance = new TerraFlowRouter();
    }
    return TerraFlowRouter.instance;
  }

  public finaliseSetup(): void {
    const terrain = (window as any).app?.$store?.state;
    if (terrain?.user?.username?.length > 0) {
      setTimeout(() => {
        this.addTerraFlowItemsToTerrainMenu();
      }, 1000);
    } else {
      // Add menu items anyway (for testing or when user state is not available)
      setTimeout(() => {
        this.addTerraFlowItemsToTerrainMenu();
      }, 1000);
    }
  }

  public resetMenu(): void {
    TerraFlowRouter.terrainNavMenuItems = TerraFlowRouter.getTerrainNavMenuItems();
    this.initNavMenu();
  }

  private async initRoutes(): Promise<void> {
    try {
      // Get the actual Terrain router instance
      const app = (window as any).app;
      const nuxt = (window as any).$nuxt;
      const terrainRouter = app?.$router || nuxt?.$router;
      
      if (terrainRouter) {
        // Add routes to Terrain's router
        terrainRouter.addRoute({
          path: "/terraflow/tools/TerraFlowCalendar",
          name: "TerraFlowCalendar",
          component: TerraFlowCalendar,
        });
        
        terrainRouter.addRoute({
          path: "/terraflow/tools/Topo",
          name: "Topo", 
          component: () => import("@/pages/TerraFlowCalendar/TerraFlowCalendar.vue"), // Temporary - use Calendar component
        });
        
        terrainRouter.addRoute({
          path: "/terraflow/tools/TerraFlowSettings",
          name: "TerraFlowSettings",
          component: TerraFlowSettings,
        });
      } else {
        // Fallback to our own router
        this.router.addRoute({
          path: "/terrain",
          redirect: "/basecamp",
        });
        this.router.addRoute({
          path: "/terraflow/tools/TerraFlowCalendar",
          component: TerraFlowCalendar,
        });
        this.router.addRoute({
          path: "/terraflow/tools/Topo",
          component: () => import("@/pages/TerraFlowCalendar/TerraFlowCalendar.vue"), // Temporary - use Calendar component
        });
        this.router.addRoute({
          path: "/terraflow/tools/TerraFlowSettings",
          component: TerraFlowSettings,
        });
      }
    } catch (error) {
      console.warn("Route init error:", error);
    }
  }

  public static getTerrainNavMenuItems(): NavMenuItem[] {
    try {
      // Try to get the Vue instance from multiple possible locations
      const app = (window as any).app || (window as any).$nuxt || (window as any).__VUE__;
      if (!app) {
        return [];
      }
      
      // For Nuxt apps, the Vue instance might be in $nuxt
      const vueInstance = app.$children ? app : ((window as any).$nuxt && (window as any).$nuxt.$root);
      if (!vueInstance || !vueInstance.$children) {
        return [];
      }
      
      const navMenuComponent = FindComponent("NavMenu", vueInstance) as NavMenuComponent;
      if (!navMenuComponent) {
        return [];
      }
      
      return (navMenuComponent as any).items || [];
    } catch (error) {
      console.warn("Error getting nav items:", error);
      return [];
    }
  }

  private initNavMenu(): void {
    this.terraflowNavMenuItems = [
      {
        title: "TerraFlow Calendar",
        to: "/terraflow/tools/TerraFlowCalendar",
        items: [],
        locked: false,
        roles: []
      },
      {
        title: "Topo",
        to: "https://nomisnostab.github.io/Topo-Blazor/index",
        items: [],
        locked: false,
        roles: [],
        external: true
      }
    ];
  }

  private addTerraFlowItemsToTerrainMenu(): void {
    try {
      const app = (window as any).app || (window as any).$nuxt || (window as any).__VUE__;
      if (!app) return;
      
      const vueInstance = app.$children ? app : ((window as any).$nuxt && (window as any).$nuxt.$root);
      if (!vueInstance) return;
      
      const navMenuComponent = FindComponent("NavMenu", vueInstance) as NavMenuComponent;
      if (!navMenuComponent) return;
      
      const menuItems = (navMenuComponent as any).items;
      if (!menuItems || !Array.isArray(menuItems)) return;
      
      // Add TerraFlow items to menu
      this.terraflowNavMenuItems.forEach(item => {
        const exists = menuItems.some((existing: any) => existing.title === item.title);
        if (!exists) {
          menuItems.push(item);
          
          // Force Vue to update
          if (navMenuComponent.$forceUpdate) {
            navMenuComponent.$forceUpdate();
          }
          
          // Try Vuex store integration
          const store = navMenuComponent.$store;
          if (store) {
            const actions = ['navigation/addMenuItem', 'nav/addMenuItem', 'menu/addMenuItem'];
            const mutations = ['navigation/ADD_MENU_ITEM', 'nav/ADD_MENU_ITEM', 'menu/ADD_MENU_ITEM'];
            
            for (const action of actions) {
              try { store.dispatch(action, item); break; } catch (e) { }
            }
            for (const mutation of mutations) {
              try { store.commit(mutation, item); break; } catch (e) { }
            }
          }
        }
      });
      
      // Fallback to DOM injection if items don't appear
      setTimeout(() => {
        if (document.querySelectorAll('.terraflow-menu-item').length === 0) {
          this.injectMenuItemDirectly();
        }
      }, 500);
      
    } catch (error) {
      console.warn("Error adding menu items:", error);
    }
  }

  public navigate(path: string, external?: boolean): void {
    try {
      if (external || path.startsWith('http://') || path.startsWith('https://')) {
        window.open(path, '_blank');
      } else {
        // Get Terrain's router
        const app = (window as any).app;
        const nuxt = (window as any).$nuxt;
        const terrainRouter = app?.$router || nuxt?.$router;
        
        if (terrainRouter) {
          const result = terrainRouter.push(path);
          if (result && typeof result.then === 'function') {
            result.catch((navError: any) => {
              console.warn("Navigation failed:", navError);
              window.location.href = window.location.origin + path;
            });
          }
        } else {
          window.location.href = window.location.origin + path;
        }
      }
    } catch (error) {
      console.warn("Navigation error:", error);
    }
  }

  public getCurrentRoute(): Route | null {
    try {
      return this.router?.currentRoute || null;
    } catch (error) {
      console.warn("Error getting route:", error);
      return null;
    }
  }

  private injectMenuItemDirectly(): void {
    try {
      // Find the navigation list/menu container
      const navContainers = [
        document.querySelector('.v-list'),
        document.querySelector('nav ul'),
        document.querySelector('.nav-menu'),
        document.querySelector('[role="navigation"] ul'),
        document.querySelector('.v-navigation-drawer .v-list')
      ].filter(Boolean);

      if (navContainers.length === 0) {
        return;
      }

      const container = navContainers[0] as HTMLElement;

      // Create menu items
      this.terraflowNavMenuItems.forEach(item => {
        // Check if item already exists
        const existingItem = document.querySelector(`.terraflow-menu-item[data-path="${item.to}"]`);
        if (existingItem) {
          return;
        }

        // Create the menu item element
        const menuItem = document.createElement('div');
        menuItem.className = 'v-list-item terraflow-menu-item';
        menuItem.setAttribute('data-path', item.to || '');
        menuItem.style.cursor = 'pointer';
        
        const menuItemContent = document.createElement('div');
        menuItemContent.className = 'v-list-item__content';
        
        const menuItemTitle = document.createElement('div');
        menuItemTitle.className = 'v-list-item__title';
        menuItemTitle.textContent = item.title;
        menuItemTitle.style.color = '#00B140';
        menuItemTitle.style.fontWeight = '500';
        
        // Add external link indicator if it's an external URL
        if (item.external || (item.to && (item.to.startsWith('http://') || item.to.startsWith('https://')))) {
          const externalIcon = document.createElement('span');
          externalIcon.textContent = ' ↗';
          externalIcon.style.fontSize = '12px';
          externalIcon.style.opacity = '0.7';
          externalIcon.title = 'Opens in new tab';
          menuItemTitle.appendChild(externalIcon);
        }
        
        menuItemContent.appendChild(menuItemTitle);
        menuItem.appendChild(menuItemContent);

        // Add click handler
        menuItem.addEventListener('click', () => {
          if (item.to) {
            this.navigate(item.to, item.external);
          }
        });

        // Add hover effects
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.backgroundColor = '#E8F5E8';
          menuItemTitle.style.color = '#006B2F';
        });
        
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.backgroundColor = '';
          menuItemTitle.style.color = '#00B140';
        });

        // Insert at the end of the navigation
        container.appendChild(menuItem);
      });
      
    } catch (error) {
      console.error('Direct DOM injection failed:', error);
    }
  }
}
