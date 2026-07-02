"""Static OpenAPI 3 schema served at ``/openapi.json`` for Swagger UI / ReDoc."""

OPENAPI_SCHEMA: dict = {
    "openapi": "3.0.3",
    "info": {
        "title": "Django + Next.js Starter Template API",
        "description": "Backend service served under the /svc/api path prefix.",
        "version": "0.1.0",
    },
    "servers": [{"url": "/svc/api"}],
    "paths": {
        "/health": {
            "get": {
                "summary": "Health",
                "operationId": "health_health_get",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {"status": {"type": "string"}},
                                }
                            }
                        },
                    }
                },
            }
        },
        "/": {
            "get": {
                "summary": "Read Root",
                "operationId": "read_root__get",
                "responses": {"200": {"description": "Successful Response"}},
            }
        },
        "/status": {
            "get": {
                "summary": "Get Status",
                "operationId": "get_status_status_get",
                "responses": {"200": {"description": "Successful Response"}},
            }
        },
        "/items": {
            "get": {
                "summary": "Get Items",
                "operationId": "get_items_items_get",
                "responses": {"200": {"description": "Successful Response"}},
            }
        },
        "/items/{item_id}": {
            "get": {
                "summary": "Get Item",
                "operationId": "get_item_items__item_id__get",
                "parameters": [
                    {
                        "name": "item_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"},
                    }
                ],
                "responses": {
                    "200": {"description": "Successful Response"},
                    "404": {"description": "Not found"},
                },
            }
        },
    },
}
