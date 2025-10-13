<template>
  <div class="settings-container">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-content">
        <h1 class="settings-title">TerraFlow Settings</h1>
        <p class="settings-subtitle">
          Configure how TerraFlow looks and behaves. Settings are saved locally in your browser.
        </p>
      </div>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      
      <!-- Event Defaults Card -->
      <div class="settings-card">
        <div class="card-header">
          <div class="card-icon">
            <span class="icon">📅</span>
          </div>
          <div class="card-title-section">
            <h2 class="card-title">Event Default Settings</h2>
            <p class="card-description">Set default values for new calendar events</p>
          </div>
        </div>
        
        <div class="card-content">
          <!-- Default Start Time -->
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-title" for="defaultStartTime">Default Start Time</label>
              <p class="setting-description">The default time for new calendar events</p>
            </div>
            <div class="setting-action">
              <input 
                type="time" 
                id="defaultStartTime" 
                v-model="defaultStartTime" 
                @change="updateDefaultStartTime"
                class="modern-input time-input"
              />
            </div>
          </div>

          <!-- Default Duration -->
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-title" for="defaultDuration">Default Duration</label>
              <p class="setting-description">How long new events should last (in minutes)</p>
            </div>
            <div class="setting-action">
              <div class="input-with-addon">
                <input 
                  type="number" 
                  id="defaultDuration" 
                  v-model="defaultDuration" 
                  @change="updateDefaultDuration"
                  min="15"
                  max="1440"
                  step="15"
                  class="modern-input number-input"
                />
                <span class="input-addon">min</span>
              </div>
            </div>
          </div>

          <!-- Default Location -->
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-title" for="defaultLocation">Default Location</label>
              <p class="setting-description">The default location for new calendar events</p>
            </div>
            <div class="setting-action">
              <input 
                type="text" 
                id="defaultLocation" 
                v-model="defaultLocation" 
                @change="updateDefaultLocation"
                placeholder="Enter default location"
                class="modern-input text-input"
              />
            </div>
          </div>

          <!-- Default Calendar -->
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-title" for="defaultCalendar">Default Calendar</label>
              <p class="setting-description">The default calendar for new events</p>
            </div>
            <div class="setting-action">
              <div class="select-wrapper">
                <select 
                  id="defaultCalendar" 
                  v-model="defaultCalendar" 
                  @change="updateDefaultCalendar"
                  class="modern-select"
                  :disabled="calendarsLoading"
                >
                  <option value="">Select a calendar...</option>
                  <option 
                    v-for="calendar in availableCalendars" 
                    :key="calendar.id" 
                    :value="calendar.id"
                  >
                    {{ calendar.title }}
                  </option>
                </select>
                <div v-if="calendarsLoading" class="loading-indicator">
                  <span class="loading-spinner"></span>
                  <span class="loading-text">Loading calendars...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Starting Day of Week -->
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-title" for="startingDayOfWeek">Starting Day of Week</label>
              <p class="setting-description">Which day should be displayed as the first day of the week in calendar views</p>
            </div>
            <div class="setting-action">
              <div class="select-wrapper">
                <select 
                  id="startingDayOfWeek" 
                  v-model="startingDayOfWeek" 
                  @change="updateStartingDayOfWeek"
                  class="modern-select"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>

    <!-- Action Buttons -->
    <div class="settings-actions">
      <button class="action-button primary" @click="applyAndReturn">
        Apply
      </button>
      <button class="action-button secondary" @click="cancelAndReturn">
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import component from './TerraFlowSettings';
export default component;
</script>

<style>
/* Import TerraFlow Settings Modern Styles */
@import '../../styles/terraflowsettings.css';

/* Existing styles below */
/* Container */
.settings-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* Header */
.settings-header {
  margin-bottom: 32px;
}

.header-content {
  text-align: center;
  padding: 40px 32px;
  background: linear-gradient(135deg, #00B140 0%, #009235 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 
    0 20px 40px rgba(0, 177, 64, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.settings-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.settings-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
}

/* Settings Content */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Settings Cards */
.settings-card {
  background: white;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-card:hover {
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 177, 64, 0.2);
  transform: translateY(-4px);
  border-color: rgba(0, 177, 64, 0.3);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #00B140, #009235);
}

.card-icon {
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00B140, #009235);
  border-radius: 16px;
  box-shadow: 
    0 8px 24px rgba(0, 177, 64, 0.3),
    0 0 0 3px rgba(255, 255, 255, 1),
    0 0 0 6px rgba(0, 177, 64, 0.2);
  border: 2px solid white;
}

.card-icon .icon {
  font-size: 28px;
  filter: grayscale(1) brightness(0) invert(1);
}

.card-title-section {
  flex: 1;
}

.card-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  letter-spacing: -0.015em;
}

.card-description {
  font-size: 1.05rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* Card Content */
.card-content {
  padding: 32px;
  background: white;
}

/* Setting Items */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: all 0.3s ease;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item:hover {
  border-color: rgba(0, 177, 64, 0.3);
  background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
  box-shadow: 0 4px 16px rgba(0, 177, 64, 0.1);
  transform: translateY(-1px);
}

.setting-info {
  flex: 1;
  margin-right: 32px;
}

.setting-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
  display: block;
  letter-spacing: -0.01em;
}

.setting-description {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

.setting-action {
  flex-shrink: 0;
}

/* Modern Toggle Switch - More Button-Like */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 68px;
  height: 36px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  border: 3px solid #94a3b8;
  border-radius: 36px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #00B140, #009235);
  border-color: #00B140;
  box-shadow: 
    0 4px 12px rgba(0, 177, 64, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(32px);
  background: linear-gradient(135deg, #ffffff, #ffffff);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.toggle-switch:hover .toggle-slider {
  transform: scale(1.05);
}

/* Modern Button-Like Inputs */
.modern-input, .modern-select {
  padding: 16px 20px;
  border: 3px solid #e2e8f0;
  border-radius: 16px;
  font-size: 1.1rem;
  font-family: inherit;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.03) inset;
  min-width: 200px;
}

.modern-input:focus, .modern-select:focus {
  outline: none;
  border-color: #00B140;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  box-shadow: 
    0 0 0 4px rgba(0, 177, 64, 0.15),
    0 8px 24px rgba(0, 177, 64, 0.2);
  transform: translateY(-2px);
}

.modern-input:hover, .modern-select:hover {
  border-color: rgba(0, 177, 64, 0.5);
  transform: translateY(-1px);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 177, 64, 0.1) inset;
}

.time-input {
  min-width: 160px;
}

.number-input {
  min-width: 120px;
  text-align: center;
}

.text-input {
  min-width: 280px;
}

/* Input with addon - More Button-Like */
.input-with-addon {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 3px solid #cbd5e1;
  border-radius: 16px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.input-with-addon:hover {
  border-color: rgba(0, 177, 64, 0.5);
  transform: translateY(-1px);
}

.input-with-addon .modern-input {
  border: none;
  background: white;
  margin: 0;
  box-shadow: none;
  min-width: 100px;
}

.input-addon {
  font-size: 1rem;
  color: #475569;
  font-weight: 700;
  padding: 16px 16px 16px 8px;
  background: linear-gradient(135deg, #00B140, #009235);
  color: white;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 177, 64, 0.3);
}

/* Select wrapper - More Defined */
.select-wrapper {
  position: relative;
}

.modern-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 52px;
  min-width: 320px;
  cursor: pointer;
}

.modern-select:disabled {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #94a3b8;
  cursor: not-allowed;
  border-color: #cbd5e1;
}

/* Loading indicator - More Prominent */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #92400e;
  font-weight: 600;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #fde68a;
  border-top: 3px solid #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive design */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }
  
  .settings-title {
    font-size: 2.2rem;
  }
  
  .card-header {
    padding: 24px;
  }
  
  .card-content {
    padding: 24px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }
  
  .setting-info {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .setting-action {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }
  
  .modern-input, .modern-select {
    width: 100%;
    min-width: auto;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .card-icon {
    margin-right: 0;
  }
}
</style>