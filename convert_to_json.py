import json

input_file = 'words.txt'
output_file = 'words.json'

definitions = {}

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        if '\t' in line:
            word, definition = line.strip().split('\t', 1)
            word = word.strip().lower()
            definition = definition.strip().split(' [', 1)[0]
            definitions[word] = definition

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(definitions, f, ensure_ascii=False, indent=2)

print(f"Converted {len(definitions)} entries to {output_file}")
