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

    sample_data = o3d.data.PLYPointCloud()
    pcd = o3d.io.read_point_cloud(sample_data.path)
    source_name = f"Open3D-Beispiel: {sample_data.path}"

    print(source_name)
    print(pcd)
    print(f"Anzahl Punkte: {len(pcd.points)}")

    if not pcd.has_colors():
        pcd.paint_uniform_color([0.1, 0.7, 0.9])
    web_pcd = pcd.voxel_down_sample(voxel_size=0.015) if len(pcd.points) > 90000 else pcd
    output_path = output_dir / "wohnzimmer_points.ply"
    o3d.io.write_point_cloud(str(output_path), web_pcd, write_ascii=True)

    print(f"Export: {output_path}")
    print(f"Web-Punkte: {len(web_pcd.points)}")

    show(pcd)
