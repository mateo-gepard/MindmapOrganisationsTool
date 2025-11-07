import type { AreaId } from '../types';

// Calculate if a point is inside a circle
export function isPointInCircle(
  point: { x: number; y: number },
  center: { x: number; y: number },
  radius: number
): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

// Calculate which areas a point belongs to
export function getAreasForPosition(
  position: { x: number; y: number },
  areas: Array<{ id: AreaId; position: { x: number; y: number }; radius: number }>
): AreaId[] {
  return areas
    .filter((area) => isPointInCircle(position, area.position, area.radius))
    .map((area) => area.id)
    .slice(0, 2); // Max 2 areas for hybrid tasks
}

// Check if two circles intersect
export function circlesIntersect(
  c1: { x: number; y: number; radius: number },
  c2: { x: number; y: number; radius: number }
): boolean {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < c1.radius + c2.radius && distance > Math.abs(c1.radius - c2.radius);
}

// Generate a default position within an area
export function getDefaultPositionInArea(
  areaId: AreaId,
  areas: Array<{ id: AreaId; position: { x: number; y: number }; radius: number }>
): { x: number; y: number } {
  const area = areas.find((a) => a.id === areaId);
  if (!area) return { x: 0, y: 0 };

  // Place slightly offset from center
  return {
    x: area.position.x + (Math.random() - 0.5) * area.radius * 0.5,
    y: area.position.y + (Math.random() - 0.5) * area.radius * 0.5,
  };
}
