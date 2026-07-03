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

    sampled_pcd = mesh.sample_points_poisson_disk(number_of_points=20000)
    sampled_pcd.paint_uniform_color([0.95, 0.55, 0.15])
    output_path = output_dir / "bunny_points.ply"
    o3d.io.write_point_cloud(str(output_path), sampled_pcd, write_ascii=True)

    print(source_name)
    print(f"Export: {output_path}")
    print(sampled_pcd)
    show(sampled_pcd)
