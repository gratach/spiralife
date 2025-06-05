// Helper functions translated from Python (Geometric)
function calculate_midpoint(point1_x, point1_y, point2_x, point2_y, factor) {
    return {
        x: point1_x + (point2_x - point1_x) * factor,
        y: point1_y + (point2_y - point1_y) * factor
    };
}

function project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height) {
    if (point_x === 0 && point_y === 0) {
        return { x: 0, y: 0 };
    }
    const half_rect_width = rect_width / 2;
    const half_rect_height = rect_height / 2;
    let scale_factor;
    if (Math.abs(point_x) / half_rect_width > Math.abs(point_y) / half_rect_height) {
        scale_factor = half_rect_width / Math.abs(point_x);
    } else {
        scale_factor = half_rect_height / Math.abs(point_y);
    }
    return {
        x: point_x * scale_factor,
        y: point_y * scale_factor
    };
}

export function project_point_within_circle_to_rectangle(point_x, point_y, rect_width, rect_height) {
    const { x: projected_edge_x, y: projected_edge_y } = project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height);
    const half_rect_width = rect_width / 2;
    const half_rect_height = rect_height / 2;
    const min_dimension_radius = Math.min(half_rect_height, half_rect_width);
    const distance_from_origin = Math.sqrt(point_x * point_x + point_y * point_y);
    
    if (distance_from_origin === 0) {
        return { x: 0, y: 0 };
    }

    const scaled_circular_x = point_x * min_dimension_radius; // Changed
    const scaled_circular_y = point_y * min_dimension_radius; // Changed
    
    return calculate_midpoint(
        scaled_circular_x,
        scaled_circular_y,
        projected_edge_x * distance_from_origin, // Changed
        projected_edge_y * distance_from_origin, // Changed
        distance_from_origin 
    );
}