from agents import Agent, Runner, GuardrailFunctionOutput, OutputGuardrail, function_tool
from pydantic import BaseModel
import asyncio
import requests

class ExpectedOutput(BaseModel):
    keyword: str
    lat: float
    lng: float


guardrail_agent = Agent(
    name="Guardrail Agent",
    handoff_description="Check if the input is latitude and longitude coordinates and a keyword",
    instructions="Check if the input is latitude and longitude coordinates and a keyword",
    output_type=ExpectedOutput,
)

async def latlong_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(ExpectedOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.lng or not final_output.lat,
    )

@function_tool
def get_local_data(ExpectedOutput: ExpectedOutput):
    url = "https://local-business-data.p.rapidapi.com/search-in-area"

    querystring = {"query":ExpectedOutput.keyword,"lat":ExpectedOutput.lat,"lng":ExpectedOutput.lng,"zoom":"13","limit":"20","language":"en","region":"us","extract_emails_and_contacts":"false"}

    headers = {
    "x-rapidapi-key": "YOUR_RAPID_API_KEY",
    "x-rapidapi-host": "local-business-data.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())

local_agent = Agent(
    name="Local Guide Agent",
    instructions="Based on the location and context provided, provide the latitude and longitude of the location to get local data as well as the keyword to search for.",
    handoff_description="Provide the local business search keyword, latitude and longitude of the location to get local data",
    tools=[
        get_local_data
    ],
    output_guardrails=[
        OutputGuardrail(guardrail_function=latlong_guardrail)
    ]
)

async def main():
    result = await Runner.run(local_agent, "I'm planning a trip to San Francisco and want a good beer with lunch, can you recommend a good place?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
