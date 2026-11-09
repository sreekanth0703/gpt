import os
from rest_framework.views import APIView
from rest_framework.response import Response
from google import genai
from google.genai import types

# --- FIX: Explicitly set api_version to 'v1beta' for tools/function calling ---
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options={"api_version": "v1beta"}
)

# --- Define Your Tools (Python Functions) ---

def get_current_weather(location: str, unit: str = "celsius") -> str:
    """Get the current weather for a given location.

    Args:
        location: The city and state, e.g. San Francisco, CA
        unit: The temperature unit, either 'celsius' or 'fahrenheit'
    """
    locations = {"hyderabad": "Sunny and 22 degrees", "new york, ny": "Cloudy and 18 degrees", "los angeles": "Sunny and 25 degrees"}
    return locations.get(location.lower(), f"Weather data for {location} is not available.") + f" in {unit}."

def calculate_tip(bill_amount: float, tip_percentage: float = 15.0) -> str:
    """Calculate the tip amount and total bill for a restaurant check.

    Args:
        bill_amount: The original cost of the bill
        tip_percentage: The tip percentage to apply (default is 15.0)
    """
    tip = bill_amount * (tip_percentage / 100)
    total = bill_amount + tip
    return f"For a bill of ${bill_amount:.2f} with a {tip_percentage}% tip, the tip is ${tip:.2f} and the total is ${total:.2f}."


class ChatAPIView(APIView):
    def post(self, request):
        user_message = request.data.get("message", "")
        chat_history = request.data.get("history", [])

        contents = []
        for m in chat_history:
            role = "user" if m["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=m["content"])]
                )
            )
        
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)]
            )
        )

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    tools=[get_current_weather, calculate_tip],
                    temperature=0.7,
                )
            )
            
            final_reply = response.text
            return Response({"reply": final_reply, "status": "success"})

        except Exception as e:
            return Response({"error": str(e)}, status=500)