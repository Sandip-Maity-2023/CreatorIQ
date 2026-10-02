from google import genai

# Pass your key explicitly inside the string
client = genai.Client(api_key=process.env.GEMINI_API_KEY)

stream = client.interactions.create(
    model="gemini-3.8-flash",
    input="Explain how AI works",
    stream=True
)
for event in stream:
    print(event)
