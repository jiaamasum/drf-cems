from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def json_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = _format_error_payload(response.data, getattr(exc, "default_code", "error"))
        return response

    return Response(
        _format_error_payload(str(exc), "server_error"),
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _format_error_payload(detail, code):
    """
    Normalize error responses to {"error": <message or object>, "code": <code>, "errors": <field errors?>}
    """
    # field-level errors
    if isinstance(detail, dict):
        if "detail" in detail and len(detail) == 1:
            return {"error": detail["detail"], "code": code}
        # keep field errors explicit
        return {"error": "Validation error", "code": code, "errors": detail}
    if isinstance(detail, list) and detail:
        return {"error": detail[0], "code": code}
    return {"error": detail, "code": code}
