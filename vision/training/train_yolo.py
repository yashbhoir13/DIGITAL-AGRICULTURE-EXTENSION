"""
Example Ultralytics training entrypoint (run when a labelled strawberry dataset is available).

  yolo detect train data=dataset/data.yaml model=yolov8n.pt epochs=50 imgsz=640 project=runs name=strawberry

Copy runs/detect/strawberry/weights/best.pt → vision/weights/best.pt

Do not invent Precision/Recall/mAP values. Report metrics from Ultralytics training logs only.
"""

from pathlib import Path


def main():
    data_yaml = Path(__file__).resolve().parents[1] / "dataset" / "data.yaml"
    if not data_yaml.exists():
        print("dataset/data.yaml missing. Prepare a YOLO-format strawberry dataset first.")
        return
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Install ultralytics to train.")
        return
    model = YOLO("yolov8n.pt")
    model.train(data=str(data_yaml), epochs=50, imgsz=640, project="runs", name="strawberry")


if __name__ == "__main__":
    main()
