import { project_point_within_circle_to_rectangle } from '../src/coordinate_transformation.js';

describe('project_point_within_circle_to_rectangle', () => {
    test('projects point (0,0) to rectangle (100,100)', () => {
        const result = project_point_within_circle_to_rectangle(0, 0, 100, 100);
        expect(result).toEqual({ x: 0, y: 0 });
    });
    
    test('projects point (1,0) to rectangle (100,100)', () => {
        const result = project_point_within_circle_to_rectangle(1, 0, 100, 100);
        expect(result).toEqual({ x: 50, y: 0 });
    });

    test('projects point (0,1) to rectangle (100,100)', () => {
        const result = project_point_within_circle_to_rectangle(0, 1, 100, 100);
        expect(result).toEqual({ x: 0, y: 50 });
    });

    test('projects point (1/sqrt(2),1/sqrt(2)) to rectangle (100,100)', () => {
        const result = project_point_within_circle_to_rectangle(1 / Math.sqrt(2), 1 / Math.sqrt(2), 100, 100);
        expect(result.x).toBeCloseTo(50, 10);
        expect(result.y).toBeCloseTo(50, 10);
    });

    test('projects point (-0.5,0) to rectangle (200,300)', () => {
        const result = project_point_within_circle_to_rectangle(-0.5, 0, 200, 300);
        expect(result.x).toBeCloseTo(-50, 10);
        expect(result.y).toBeCloseTo(0, 10);
    });

    test('projects point (0,0.5) to rectangle (200,100)', () => {
        const result = project_point_within_circle_to_rectangle(0, 0.5, 200, 100);
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(25, 10);
    });
});