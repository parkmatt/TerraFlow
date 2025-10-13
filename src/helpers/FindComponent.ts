export default function FindComponent(componentName: string, instance: Vue): Vue | null {
  if (!instance || !instance.$options) {
    return null;
  }
  
  if (instance.$options.name === componentName) {
    return instance;
  }
  
  if (!instance.$children || !Array.isArray(instance.$children)) {
    return null;
  }
  
  for (const child of instance.$children) {
    const found = FindComponent(componentName, child);
    if (found != null) {
      return found;
    }
  }
  return null;
}
