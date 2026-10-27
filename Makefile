.PHONY: test serve clean

test:
	python3 -m unittest discover -s tests -v

serve:
	python3 -m http.server 8000

clean:
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type f \( -name '*.pyc' -o -name '*.pyo' -o -name '*.bak' -o -name '*.orig' -o -name '*.tmp' \) -delete
