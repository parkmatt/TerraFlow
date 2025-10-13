import React from "react";
import { Root, createRoot } from "react-dom/client";
import TerraFlowCalendarItem from "./models/TerraFlowCalendarItems";
import { TerrainRootState } from "@/types/terrainState";
import { defineComponent } from "vue";
import { TerraFlowCalendarComponent } from "./components/TerraFlowCalendar";

function data() {
  return {
    items: [] as TerraFlowCalendarItem[],
    root: undefined as Root | undefined,
  };
}

export default defineComponent({
  name: "BulkCalendar",
  data,
  watch: {
    items(newItems: TerraFlowCalendarItem[]) {
      this.renderReactComponent(newItems);
    },
  },
  mounted() {
    this.getCalendarData();
    this.mountReactComponent();
    (window.$nuxt.$store.state as TerrainRootState).global.breadcrumbs = [
      {
        text: "TerraFlow",
        disabled: false,
        to: "/terraflow/tools/TerraFlowCalendar",
        exact: true,
      },
      {
        text: "Calendar",
        disabled: true,
        to: "/terraflow/tools/TerraFlowCalendar",
        exact: true,
      },
    ];
  },
  beforeDestroy() {
    this.unmountReactComponent();
  },
  methods: {
    async getCalendarData() {},
    mountReactComponent() {
      this.root = createRoot(this.$refs.reactRoot as HTMLElement);
      this.renderReactComponent(this.items);
    },
    renderReactComponent(items: TerraFlowCalendarItem[]) {
      const reactElement = React.createElement(TerraFlowCalendarComponent, {
        items,
        onUpdate: this.handleUpdate,
      });
      this.root?.render(reactElement);
    },
    unmountReactComponent() {
      if (this.root) this.root.unmount();
      this.root = undefined;
    },
    handleUpdate(updatedItems: TerraFlowCalendarItem[]) {
      // Handle the updates here
      this.items = updatedItems; // Update your Vue component's state
    },
    openOptions() {
      // Navigate to the TerraFlow Settings page using multiple approaches
      try {
        this.$router.push('/terraflow/tools/TerraFlowSettings');
      } catch (error) {
        // Fallback navigation
        console.warn('Router navigation failed, using window location:', error);
        window.location.href = window.location.origin + '/terraflow/tools/TerraFlowSettings';
      }
    },
  },
});
