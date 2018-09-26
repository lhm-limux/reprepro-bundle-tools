SHELL := bash
BUNDLE := ../bin/bundle
REPO_RSYNC := rsync -a --delete --exclude dists --exclude lists --exclude db --exclude pool

IS_GIT_TREE := (which git && git ls-files --error-unmatch) >/dev/null 2>&1
CONTINUE := true
ifeq (no,$(shell $(IS_GIT_TREE) || echo no))
  CONTINUE := exit 1
endif

HR=echo "========================================================="
T = function testcase {\
        local name=$$1; shift; \
        local retExp=$$1; shift; \
        local pwdUrl=$$(pwd | sed "s/ /%20/g"); \
        mkdir -p repo; \
        echo "STARTING TEST $$name"; \
        test -x resources/batch_editor_$$name && { export EDITOR=resources/batch_editor_$$name; echo "setting EDITOR=$$EDITOR"; }; \
        ret=0; \
        ( \
          set -x; \
          $$@ >repo/cmd.log 2>&1 || ret=$$?; \
          test $$ret = $$retExp || exit 1; \
          $(REPO_RSYNC) repo/ resources/$${name}.res; \
          sed -i "s~$$pwdUrl~…TESTDIR…~" $$(find resources/$$name.res -type f); \
          diff -u -r resources/$$name.ref resources/$$name.res || exit 1; \
        ) && echo "TEST OK: $$name" || { echo "TEST FAILED: $$name"; $(CONTINUE); }; \
        echo ""; $(HR); \
    }; testcase


main: bundle_tests git_diff_results

bundle_tests: clean
	@$(T) bundle_init 0   $(BUNDLE) init mybionic --no-clean-commit
	@$(T) bundle_apply1 0 $(BUNDLE) apply mybionic/0001
	@$(T) bundle_edit 0   $(BUNDLE) edit mybionic/0001
	@$(T) bundle_apply2 0 $(BUNDLE) apply mybionic/0001

clean:
	rm -Rf repo
	rm -Rf resources/*.res
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
	for i in resources/*.res; do \
		$(REPO_RSYNC) $$i/ $${i/.res/.ref}; \
	done
	git diff --quiet --exit-code resources/*.ref
	@echo "FINISHED SUCCESSFULLY"
else
  git_diff_results:
	@echo "Skipping git_diff_results as this is not a git tree"
endif

