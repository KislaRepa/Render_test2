const fs = require("fs");
const createAssistant = async (openai) => {
  const assistantFilePath = "assistant.json";
  if (!fs.existsSync(assistantFilePath)) {
    const file = await openai.files.create({
      file: fs.createReadStream("Slovenj_Gradec_odlok.pdf"),
      purpose: "assistants",
    });
    let vectorStore = await openai.beta.vectorStores.create({
      name: "Chat Demo",
      file_ids: [file.id],
    });
    const assistant = await openai.beta.assistants.create({
      name: "Občinski svetovalec  - 112 SG",
      instructions: `Interpretacija in odgovarjanje na vprašanja povezava z odlokom o občinskem prostorskem načrtu Mestne občine Slovenj Gradec. Uporabi celoten odlok OPN Slovenj Gradec, ki je priložen v PDF obliki, kot referenčno gradivo za odgovore. Pri odgovarjanju bodi strokoven in formalen. Vedno odgovarjaj v slovenskem jeziku, razen če posebej zahtevamo za drug jezik.`,
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
      model: "gpt-4o-mini",
    });
    fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
    return assistant;
  } else {
    const assistant = JSON.parse(fs.readFileSync(assistantFilePath));
    return assistant;
  }
};
module.exports = { createAssistant };
