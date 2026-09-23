from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# In-memory realistic marketplace listings
_MARKETPLACE_LISTINGS: list[dict[str, Any]] = [
    {
        "id": "LOT-801",
        "farmer_name": "Ramesh Patil",
        "farm_name": "Sahyadri Strawberry Farm",
        "location": "Mahabaleshwar, Satara, Maharashtra",
        "crop": "Strawberry",
        "variety": "Winter Dawn Premium",
        "quantity_quintals": 45,
        "price_per_kg": 230,
        "harvest_date": "2026-09-18",
        "status": "Ready for Booking",
        "phone": "+91 99233 45931",
        "whatsapp": "919923345931",
        "organic_certified": True,
        "grade": "Grade A Export Quality",
        "notes": "Pre-cooled at 4°C, packaged in 250g punnets, cold-chain transport ready.",
    },
    {
        "id": "LOT-802",
        "farmer_name": "Suresh Deshmukh",
        "farm_name": "Godavari Green Farms",
        "location": "Pimpalgaon Baswant, Nashik, Maharashtra",
        "crop": "Tomato",
        "variety": "Abhinav Hybrid Red",
        "quantity_quintals": 120,
        "price_per_kg": 24,
        "harvest_date": "2026-09-12",
        "status": "Harvesting Now",
        "phone": "+91 99233 45931",
        "whatsapp": "919923345931",
        "organic_certified": False,
        "grade": "Grade A Firm Fruit",
        "notes": "Ideal for long-distance transport to Mumbai/Delhi terminal markets.",
    },
    {
        "id": "LOT-803",
        "farmer_name": "Ganesh Shinde",
        "farm_name": "Lasalgaon Agro Producer Group",
        "location": "Lasalgaon, Niphad, Nashik",
        "crop": "Onion",
        "variety": "Nashik Garwa Red",
        "quantity_quintals": 350,
        "price_per_kg": 22,
        "harvest_date": "2026-09-25",
        "status": "Cured & Stored",
        "phone": "+91 99233 45931",
        "whatsapp": "919923345931",
        "organic_certified": False,
        "grade": "Medium-Large Bulbs (45-55mm)",
        "notes": "Naturally cured under ventilated shed, high shelf life of 3+ months.",
    },
    {
        "id": "LOT-804",
        "farmer_name": "Anil Kadam",
        "farm_name": "Krishna Valley Vineyards",
        "location": "Tasgaon, Sangli, Maharashtra",
        "crop": "Grapes",
        "variety": "Thompson Seedless",
        "quantity_quintals": 80,
        "price_per_kg": 72,
        "harvest_date": "2026-10-05",
        "status": "Pre-Harvest Booking",
        "phone": "+91 99233 45931",
        "whatsapp": "919923345931",
        "organic_certified": True,
        "grade": "Export Berry (18mm+ Brix 18°)",
        "notes": "APEDA Residue-free certified, suited for supermarket chains and exporters.",
    },
]


class NewListingPayload(BaseModel):
    crop: str
    variety: str
    quantity_quintals: float
    price_per_kg: float
    harvest_date: str
    farm_name: str
    location: str
    phone: str
    whatsapp: str
    organic_certified: bool = False
    grade: str = "Grade A"
    notes: str = ""


@router.get("/listings")
def get_listings():
    """Returns active harvest listings from farmers."""
    return {"listings": _MARKETPLACE_LISTINGS}


@router.post("/listings")
def create_listing(payload: NewListingPayload, user: User = Depends(get_current_user)):
    """Allows a farmer to post produce for direct wholesale buyers and FPOs."""
    new_item = {
        "id": f"LOT-{len(_MARKETPLACE_LISTINGS) + 805}",
        "farmer_name": user.full_name,
        "farm_name": payload.farm_name,
        "location": payload.location,
        "crop": payload.crop,
        "variety": payload.variety,
        "quantity_quintals": payload.quantity_quintals,
        "price_per_kg": payload.price_per_kg,
        "harvest_date": payload.harvest_date,
        "status": "Active Listing",
        "phone": payload.phone,
        "whatsapp": payload.whatsapp.replace("+", "").replace(" ", ""),
        "organic_certified": payload.organic_certified,
        "grade": payload.grade,
        "notes": payload.notes,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    _MARKETPLACE_LISTINGS.insert(0, new_item)
    return {"ok": True, "listing": new_item}
