"""kenya-locations FastAPI demo.

Mounts the ready-made router at /locations and adds a delivery endpoint that
validates county, constituency and ward codes in its request body.

    uv run --project packages/python uvicorn main:app --app-dir examples/fastapi --reload
"""

from typing import Self

from fastapi import FastAPI
from pydantic import BaseModel, model_validator

import kenya_locations as kl
from kenya_locations.contrib.fastapi import (
    ConstituencyCode,
    CountyCode,
    CountyFromPath,
    WardCode,
    create_router,
)

app = FastAPI(title="kenya-locations demo")
app.include_router(create_router(), prefix="/locations")


class Delivery(BaseModel):
    """A delivery address. Codes may be sent as strings or numbers."""

    recipient: str
    county: CountyCode
    constituency: ConstituencyCode
    ward: WardCode

    @model_validator(mode="after")
    def check_nesting(self) -> Self:
        """The ward must be in the constituency, and the constituency in the county."""
        constituency = kl.get_constituency_by_code(self.constituency)
        ward = kl.get_ward_by_code(self.ward)
        if constituency is None or constituency.county_code != self.county:
            raise ValueError("constituency is not in the county")
        if ward is None or ward.constituency_code != self.constituency:
            raise ValueError("ward is not in the constituency")
        return self


class DeliveryReceipt(BaseModel):
    """What the endpoint confirms back."""

    recipient: str
    address: str


@app.post("/deliveries", status_code=201)
def create_delivery(delivery: Delivery) -> DeliveryReceipt:
    """Accept a delivery and spell out its address."""
    ward = kl.get_ward_by_code(delivery.ward)
    county = kl.get_county_by_code(delivery.county)
    assert ward is not None  # validated by Delivery
    assert county is not None
    return DeliveryReceipt(
        recipient=delivery.recipient,
        address=f"{ward.name} ward, {ward.constituency}, {county.name} County",
    )


@app.get("/counties/{county}/delivery-fee")
def delivery_fee(county: CountyFromPath) -> dict[str, str | int]:
    """Use the path dependency in your own routes: any code or name works."""
    return {"county": county.name, "fee_kes": 200 if county.code == "047" else 450}
