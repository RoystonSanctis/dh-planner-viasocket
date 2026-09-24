/*
  Uses KB_URLS and helper functions (parseFrontmatter, createMarkdownChunks, extractKnowledgeBaseSections)
  Assumes the config provides: knowledge_base (array), input_query (array), module (string), and allow_partial_match (boolean)
*/

const isPartialMatchAllowed = false;

const knowledge_base = [
  "All"
];

const module = "dh_connection";

const input_query = [
  "Page Index"
];

const KB_URLS = {
  "dh_action_trigger": {
    "dh-knowledgebase": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-knowledgebase.md",
    "dh-Input-fields-json-builder": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-Input-fields-json-builder.md",
    "perform-code": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/perform-code.md",
    "dh-review": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-review.md",
    "ux-practice": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/ux-practice.md",
    "ux-worked-examples": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/ux-worked-examples.md",
    "dh-database-schema": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-database-schema.md"
  },

  "dh_connection": {
    "connection-knowledgebase": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-connection-kb.md",
    "connection-practice": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-connection-practice.md",
    "connection-database-schema": "https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/knowledge-base/dh-connection-schema.md"
  }
};

function parseFrontmatter(mdContent) {
  const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/;

  const match = mdContent.match(frontmatterRegex);

  let metadata = {
    title: "",
    description: ""
  };

  let body = mdContent;

  if (match) {
    const yamlBlock = match[1];

    body = mdContent
      .slice(match[0].length)
      .trim();

    const titleMatch = yamlBlock.match(/title:\s*"?([^"\n]+)"?/);
    const descMatch = yamlBlock.match(/description:\s*"?([^"\n]+)"?/);

    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
  }

  return {
    metadata,
    body
  };
}


function createMarkdownChunks(mdContent) {
  if (!mdContent) {
    return {
      chunks: []
    };
  }

  /*
    Split whenever a Markdown heading starts.

    Supports both:

    # Heading

    and:

    **# Heading**

    Your KB currently uses the second format.
  */
  const sections = mdContent.split(
    /(?=^(?:\*\*)?#{1,6}\s+)/m
  );

  const chunks = sections
    .map(section => section.trim())
    .filter(section => section.length > 0)
    .map(section => {

      const lines = section.split("\n");

      const firstLine = lines[0].trim();

      /*
        Extract heading from:

        # Heading

        or:

        **# Heading**
      */
      const headingMatch = firstLine.match(
        /^\*\*#{1,6}\s+(.*?)\*\*$/
      ) || firstLine.match(
        /^#{1,6}\s+(.*)$/
      );

      const vectorSource = headingMatch
        ? headingMatch[1].trim()
        : "Untitled Section";

      return {
        text: section,
        vectorSource
      };
    });

  return {
    chunks
  };
}


async function extractKnowledgeBaseSections(
  module,
  knowledge_base,
  query,
  allowPartialMatch = false
) {
  let kbsToFetch = [];

  const moduleKBs = KB_URLS[module] || {};

  if (
    Array.isArray(knowledge_base) &&
    knowledge_base.includes("All")
  ) {
    kbsToFetch = Object.keys(moduleKBs);
  } else {
    kbsToFetch = Array.isArray(knowledge_base)
      ? knowledge_base.filter(k => moduleKBs[k])
      : [];
  }

  const results = [];

  for (const kb of kbsToFetch) {

    try {

      const response = await fetch(moduleKBs[kb]);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch status: ${response.status}`
        );
      }

      const rawMd = await response.text();

      const {
        metadata,
        body
      } = parseFrontmatter(rawMd);

      const {
        chunks
      } = createMarkdownChunks(body);

      const extractedResult = {
        knowledge_base: kb,
        title: metadata.title || kb,
        description: metadata.description || "",
        content: ""
      };

      let matchedSections = [];

      /*
        Every query is treated equally.

        "Page Index" is no longer skipped.
      */
      (Array.isArray(query) ? query : []).forEach(q => {

        const qLower = String(q || "")
          .trim()
          .toLowerCase();

        if (!qLower) {
          return;
        }

        const matches = chunks.filter(c => {

          const headerLower = c.vectorSource
            .trim()
            .toLowerCase();

          return allowPartialMatch
            ? headerLower.includes(qLower)
            : headerLower === qLower;
        });

        matchedSections.push(
          ...matches.map(m => m.text)
        );
      });

      /*
        Remove duplicate sections while preserving order.
      */
      matchedSections = [
        ...new Set(matchedSections)
      ];

      extractedResult.content =
        matchedSections.join("\n\n");

      results.push(extractedResult);

    } catch (error) {

      results.push({
        knowledge_base: kb,
        error: error.message
      });

    }
  }

  return results;
}


// Execute
return await extractKnowledgeBaseSections(
  module,
  knowledge_base,
  input_query,
  isPartialMatchAllowed
);