# FastAPI example

A small FastAPI app built on the `kenya-locations` Python package
(`packages/python`).

- The ready-made router is mounted at `/locations`.
- `POST /deliveries` validates county, constituency and ward codes in the
  request body, and checks that they nest.
- `GET /counties/{county}/delivery-fee` uses the `CountyFromPath` dependency
  in a custom route.

## Run it

From the repository root, with [uv](https://docs.astral.sh/uv/):

```bash
uv run --project packages/python --with uvicorn uvicorn main:app --app-dir examples/fastapi --reload
```

Open http://127.0.0.1:8000/docs for the interactive API docs.

## Test it

```bash
uv run --project packages/python pytest examples/fastapi
```
