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
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (!hostname.includes('terrain.scouts.com.au')) {
      console.log('TerraFlow: Not on Terrain domain, skipping setup');
      return;
    }
    
    if (pathname.includes('/login') || pathname.includes('/auth') || pathname === '/') {
      console.log('TerraFlow: On login/auth page, skipping setup');
      return;
    }
    
    console.log('TerraFlow: Setting up hover menu near burger button...');
    
    // Create hover menu near the burger button
    setTimeout(() => {
      this.createHoverMenu();
    }, 2000);
  }

  private createHoverMenu(): void {
    console.log('TerraFlow: Creating hover menu...');
    
    // Remove existing menu if any
    const existing = document.getElementById('terraflow-hover-menu');
    if (existing) {
      existing.remove();
    }
    
    // Create the hover menu container
    const hoverMenu = document.createElement('div');
    hoverMenu.id = 'terraflow-hover-menu';
    
    // Create trigger button
    const trigger = document.createElement('div');
    trigger.id = 'terraflow-trigger';
    trigger.style.cssText = `
      position: fixed;
      top: 16px;
      left: 300px;
      width: auto;
      min-width: 100px;
      height: 32px;
      padding: 0 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
      font-family: Arial, sans-serif;
      gap: 6px;
    `;
    
    // Create icon using Unicode symbol instead of SVG
    const icon = document.createElement('span');
    icon.textContent = '⚜️';
    icon.style.cssText = `
      font-size: 14px;
      opacity: 0.8;
    `;
    
    trigger.appendChild(icon);
    trigger.appendChild(document.createTextNode('TerraFlow'));
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'terraflow-dropdown';
    dropdown.innerHTML = `
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.5px;
      ">TERRAFLOW</div>
      
      <!-- Menu Items -->
      <div style="padding: 4px 0;">
        <a href="/terraflow/tools/TerraFlowCalendar" id="tf-calendar-link" style="
          display: flex;
          align-items: center;
          padding: 10px 12px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          transition: background-color 0.2s;
          border: none;
        ">
          <span style="margin-right: 8px; font-size: 16px;">📅</span>
          Calendar
        </a>
        <a href="https://nomisnostab.github.io/Topo-Blazor/index" target="_blank" rel="noopener" id="tf-topo-link" style="
          display: flex;
          align-items: center;
          padding: 10px 12px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          transition: background-color 0.2s;
          border: none;
        ">
          <span style="margin-right: 8px; font-size: 16px;">🗺️</span>
          Topo Reports
        </a>
      </div>
    `;
    dropdown.style.cssText = `
      position: fixed;
      top: 52px;
      left: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1099;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      min-width: 160px;
      overflow: hidden;
      font-family: Arial, sans-serif;
    `;
    
    hoverMenu.appendChild(trigger);
    hoverMenu.appendChild(dropdown);
    
    document.body.appendChild(hoverMenu);
    
    // Get the created elements
    const triggerElement = document.getElementById('terraflow-trigger');
    const dropdownElement = document.getElementById('terraflow-dropdown');
    const calendarLink = document.getElementById('tf-calendar-link');
    const topoLink = document.getElementById('tf-topo-link');
    
    if (!triggerElement || !dropdownElement) return;
    
    let hoverTimeout: NodeJS.Timeout | null = null;
    
    // Show dropdown on hover
    const showDropdown = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      
      if (dropdownElement) {
        dropdownElement.style.opacity = '1';
        dropdownElement.style.visibility = 'visible';
        dropdownElement.style.transform = 'translateY(0)';
      }
      
      if (triggerElement) {
        triggerElement.style.background = 'rgba(255, 255, 255, 0.2)';
        triggerElement.style.transform = 'scale(1.05)';
      }
    };
    
    // Hide dropdown with delay
    const hideDropdown = () => {
      hoverTimeout = setTimeout(() => {
        if (dropdownElement) {
          dropdownElement.style.opacity = '0';
          dropdownElement.style.visibility = 'hidden';
          dropdownElement.style.transform = 'translateY(-10px)';
        }
        
        if (triggerElement) {
          triggerElement.style.background = 'rgba(255, 255, 255, 0.1)';
          triggerElement.style.transform = 'scale(1)';
        }
      }, 150);
    };
    
    // Event listeners
    triggerElement.addEventListener('mouseenter', showDropdown);
    triggerElement.addEventListener('mouseleave', hideDropdown);
    dropdownElement.addEventListener('mouseenter', showDropdown);
    dropdownElement.addEventListener('mouseleave', hideDropdown);
    
    // Add hover effects to menu items
    if (calendarLink) {
      calendarLink.addEventListener('mouseenter', () => {
        calendarLink.style.backgroundColor = '#f8f9fa';
      });
      calendarLink.addEventListener('mouseleave', () => {
        calendarLink.style.backgroundColor = 'transparent';
      });
      calendarLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/terraflow/tools/TerraFlowCalendar';
      });
    }
    
    if (topoLink) {
      topoLink.addEventListener('mouseenter', () => {
        topoLink.style.backgroundColor = '#f8f9fa';
      });
      topoLink.addEventListener('mouseleave', () => {
        topoLink.style.backgroundColor = 'transparent';
      });
    }
    
    console.log('TerraFlow: Hover menu created successfully');
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
          const store = (navMenuComponent as any).$store;
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
