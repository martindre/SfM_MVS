from pathlib import Path
import open3d as o3d

def show(geometry, mesh_wireframe=False):
    o3d.visualization.draw_geometries(
        [geometry],
        window_name="Open3D Viewer",
        width=1280,
        height=720,
        mesh_show_wireframe=mesh_wireframe,
        point_show_normal=False,
    )


if __name__ == "__main__":
    output_dir = Path(__file__).resolve().parents[1] / "quarto" / "models"
    output_dir.mkdir(parents=True, exist_ok=True)

    sample_data = o3d.data.BunnyMesh()
    mesh = o3d.io.read_triangle_mesh(sample_data.path)
    source_name = f"Open3D-Beispiel: {sample_data.path}"

    mesh.compute_vertex_normals()

    if not mesh.has_vertex_colors():
        mesh.paint_uniform_color([0.75, 0.75, 0.75])
    output_path = output_dir / "bunny_mesh.ply"
    web_output_path = output_dir / "bunny_mesh_web.ply"
    web_mesh = mesh.simplify_quadric_decimation(target_number_of_triangles=18000)
    web_mesh.remove_degenerate_triangles()
    web_mesh.remove_duplicated_triangles()
    web_mesh.remove_duplicated_vertices()
    web_mesh.remove_non_manifold_edges()
    web_mesh.compute_vertex_normals()
    if not web_mesh.has_vertex_colors():
        web_mesh.paint_uniform_color([0.75, 0.75, 0.75])

    o3d.io.write_triangle_mesh(str(output_path), mesh, write_ascii=True)
    o3d.io.write_triangle_mesh(str(web_output_path), web_mesh, write_ascii=True)

    print(source_name)
    print(f"Export: {output_path}")
    print(f"Web-Export: {web_output_path}")
    print(mesh)
    show(mesh, mesh_wireframe=False)
