"""The demo page renders chained selects and saves only consistent addresses."""

from django.test import TestCase

from kenya_demo.models import DeliveryAddress


class AddressFormTests(TestCase):
    def test_renders_chained_selects(self) -> None:
        response = self.client.get("/")
        self.assertContains(response, 'data-kl-parent="county"')
        self.assertContains(response, 'data-kl-url="/locations/constituencies/__parent__/wards/"')
        self.assertContains(response, "kenya_locations/chained.js")

    def test_saves_a_consistent_address(self) -> None:
        data = {"recipient": "Wanjiku", "county": "47", "constituency": "274", "ward": "1370"}
        response = self.client.post("/", data)
        self.assertRedirects(response, "/")
        address = DeliveryAddress.objects.get()
        self.assertEqual(address.county, "047")
        self.assertEqual(str(address), "Wanjiku, Mountain view, Nairobi")

    def test_rejects_a_ward_outside_its_constituency(self) -> None:
        data = {"recipient": "Otieno", "county": "47", "constituency": "274", "ward": "0133"}
        response = self.client.post("/", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "This ward is not in the selected constituency.")
        self.assertFalse(DeliveryAddress.objects.exists())

    def test_json_views_are_routed(self) -> None:
        response = self.client.get("/locations/counties/47/constituencies/")
        self.assertEqual(len(response.json()["results"]), 17)


class AdminTests(TestCase):
    def test_admin_form_uses_chained_selects(self) -> None:
        from django.contrib.auth import get_user_model

        admin = get_user_model().objects.create_superuser("admin", "admin@example.test", "x")
        self.client.force_login(admin)
        response = self.client.get("/admin/kenya_demo/deliveryaddress/add/")
        self.assertContains(response, 'data-kl-parent="constituency"')
        self.assertContains(response, "kenya_locations/chained.js")
