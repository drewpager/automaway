from agents import Agent, Runner, GuardrailFunctionOutput, ToolCallOutputItem, function_tool, OutputGuardrail
from pydantic import BaseModel
from typing import Optional, List    
import asyncio
import json
import requests
import os
ahrefs_api_key = os.environ["AHREFS_API_KEY"]

class ExpectedOutput(BaseModel):
    range_data: List[str]

guardrail_agent = Agent(
    name="Guardrail Agent",
    handoff_description="Check if the input is a list of keywords as strings",
    instructions="Check if the agent has returned a list of keywords as strings for SEO analysis",
    output_type=ExpectedOutput,
)

async def kw_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(ExpectedOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.range_data,
    )

@function_tool
def get_ahrefs_data(range_data: List[str]) -> Optional[dict]:
    print(f"Received range data: {range_data}")
    format_range = [item.lower().replace(" ", "+") for item in range_data]
    formatted_range = "%2C+".join(format_range)

    url = f"https://api.ahrefs.com/v3/keywords-explorer/overview?select=clicks%2Cvolume%2Ckeyword%2Cdifficulty&country=us&keywords={formatted_range}"

    headers = {
        "Accept": "application/json, application/xml",
        "Authorization": f"Bearer {ahrefs_api_key}"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
        num = response.json()
        return num
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL: {e}")
        return None, None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return None, None

research_agent = Agent(
    name="Keyword Research Agent",
    handoff_description="Identify some additional keywords to target based on the given keyword",
    instructions="Based on the keyword provided, create a list of 10 additional keywords the company should likely target as well. Please pass a single list of strings into the tool for evaluation.",
    tools=[
        get_ahrefs_data,
    ],
    output_guardrails=[
        OutputGuardrail(guardrail_function=kw_guardrail),
    ],
)

def extract_keyword_data(run_result):
    for item in run_result:
        if isinstance(item, ToolCallOutputItem):
            output_string = item.output
            print(output_string)


async def main():
    result = await Runner.run(research_agent, "401k vs roth ira")
    keywords = extract_keyword_data(result.new_items)
    print(keywords)

if __name__ == "__main__":
    asyncio.run(main())
