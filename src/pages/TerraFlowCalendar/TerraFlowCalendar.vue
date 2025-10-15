<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 id="bulkHeader" style="margin: 0;">TerraFlow Calendar</h2>
      <button 
        @click="openOptions" 
        title="Settings" 
        style="
          background: white; 
          border: 1px solid #ddd; 
          border-radius: 10%; 
          width: 100px; 
          height: 40px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: #666;
          font-size: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        "
        @mouseover="$event.target.style.backgroundColor = '#f5f5f5'; $event.target.style.borderColor = '#00B140'"
        @mouseout="$event.target.style.backgroundColor = 'white'; $event.target.style.borderColor = '#ddd'"
      >
        ⚙️Settings
      </button>
    </div>
    <div ref="reactRoot"></div>
  </div>
</template>

<script lang="ts" src="./TerraFlowCalendar.ts">
</script>

<style scoped>

</style>