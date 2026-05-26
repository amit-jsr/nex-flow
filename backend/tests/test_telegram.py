from main import app


def test_telegram_and_health_routes_are_exposed() -> None:
    paths = {route.path for route in app.routes}
    assert "/telegram/webhook" in paths
    assert "/health" in paths
