SHELL := bash
BUNDLE := ../bin/bundle

IS_GIT_TREE := (which git && git ls-files --error-unmatch) >/dev/null 2>&1
CONTINUE := true
ifeq (no,$(shell $(IS_GIT_TREE) || echo no))
  CONTINUE := exit 1
endif

HR=echo "========================================================="
T = function testcase {\
        local name=$$1; shift; \
        local retExp=$$1; shift; \
        echo "STARTING TEST $$name"; \
	test -x resources/batch_editor_$$name && { export EDITOR=resources/batch_editor_$$name; echo "setting EDITOR=$$EDITOR"; }; \
	ret=0; \
	( \
          set -x; \
          $$@ >resources/$$name.res 2>&1 || ret=$$?; \
	  test $$ret = $$retExp || exit 1; \
          diff -u resources/$$name.res resources/$$name.ref || exit 1; \
          diff -u -r repo/bundle/*/*/conf resources/$$name/bundle/*/*/conf || exit 1; \
        ) && echo "TEST OK: $$name" || { echo "TEST FAILED: $$name"; $(CONTINUE); }; \
        echo ""; $(HR); \
    }; testcase


main: bundle_tests git_diff_results

bundle_tests: clean 
	@$(T) bundle_init 0   $(BUNDLE) init bionic --no-clean-commit
	@$(T) bundle_apply1 0 $(BUNDLE) apply bionic/0001
	@$(T) bundle_edit 0   $(BUNDLE) edit bionic/0001

clean:
	rm -Rf repo
	rm -f resources/*.res
	@$(HR)


ifeq (yes,$(shell $(IS_GIT_TREE) && echo yes))
  returncodes:
	make main IS_GIT_TREE=false
else
  returncodes:
	@echo "Skipping returncodes as this is not a git tree"
endif


ifeq (yes,$(shell $(IS_GIT_TREE) && echo yes))
  git_diff_results:
	@echo "Using git diff to compare results and references"
	bash -c 'for i in resources/*.res; do \
		cp $$i $${i/.res/.ref}; \
	done'
	git diff --quiet --exit-code resources/*.ref
	@echo "FINISHED SUCCESSFULLY"
else
  git_diff_results:
	@echo "Skipping git_diff_results as this is not a git tree"
endif

