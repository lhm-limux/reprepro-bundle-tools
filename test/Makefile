SHELL := bash
BUNDLE := ../bin/bundle
REPO_RSYNC := rsync -a --delete --exclude dists --exclude lists --exclude db --exclude pool
NO_DEEP := "--exclude bundle"

IS_GIT_TREE := (which git && git ls-files --error-unmatch) >/dev/null 2>&1
CONTINUE := true
ifeq (no,$(shell $(IS_GIT_TREE) || echo no))
  CONTINUE := exit 1
endif

HR=echo "========================================================="
T = function testcase {\
        local name=$$1; shift; \
        local retExp=$$1; shift; \
        local syncArgs=$$1; shift; \
        local pwdUrl=$$(pwd | sed "s/ /%20/g"); \
        mkdir -p repo; \
        rm -f repo/editor.*; \
        echo "STARTING TEST $$name"; \
        test -x resources/batch_editor_$$name && { export EDITOR=resources/batch_editor_$$name; echo "setting EDITOR=$$EDITOR"; }; \
        ret=0; \
        ( \
          set -x; \
          $$@ >repo/cmd.log 2>&1 || ret=$$?; \
          test $$ret = $$retExp || exit 1; \
          $(REPO_RSYNC) $$syncArgs repo/ resources/$${name}.res; \
          sed -i "s~$$pwdUrl~…TESTDIR…~" $$(find resources/$$name.res -type f); \
          diff -u -r resources/$$name.ref resources/$$name.res || exit 1; \
        ) && echo "TEST OK: $$name" || { echo "TEST FAILED: $$name"; $(CONTINUE); }; \
        echo ""; $(HR); \
    }; testcase


main: bundle_workflow bundle_help git_diff_results

bundle_workflow: clean
	@$(T) bundle_01_init         0 "" $(BUNDLE) init mybionic --no-clean-commit
	@$(T) bundle_02_apply        0 "" $(BUNDLE) apply mybionic/0001
	@$(T) bundle_03_edit         0 "" $(BUNDLE) edit mybionic/0001
	@$(T) bundle_04_apply        0 "" $(BUNDLE) apply mybionic/0001
	@$(T) bundle_05_meta         0 "" $(BUNDLE) meta mybionic/0001
	@$(T) bundle_06_show         0 "" $(BUNDLE) show mybionic/0001
	@$(T) bundle_06_list         0 "" $(BUNDLE) list mybionic/0001
	@$(T) bundle_06_bundles      0 "" $(BUNDLE) bundles mybionic
	@$(T) bundle_06_bundles_l    0 "" $(BUNDLE) bundles mybionic -l
	@$(T) bundle_07_black        0 "" $(BUNDLE) black mybionic/0001
	@$(T) bundle_08_apply        0 "" $(BUNDLE) apply mybionic/0001
	@$(T) bundle_09_show         0 "" $(BUNDLE) show mybionic/0001
	@$(T) bundle_10_edit_cancel  0 "" $(BUNDLE) edit mybionic/0001
	@$(T) bundle_11_meta_cancel  0 "" $(BUNDLE) meta mybionic/0001
	@$(T) bundle_12_black_cancel 0 "" $(BUNDLE) black mybionic/0001
	@$(T) bundle_13_seal         0 "" $(BUNDLE) seal mybionic/0001
	@$(T) bundle_14_edit         1 "" $(BUNDLE) edit mybionic/0001
	@$(T) bundle_15_clone        0 "" $(BUNDLE) clone mybionic/0001 --no-clean-commit
	@$(T) bundle_16_bundles      0 "" $(BUNDLE) bundles -l
	@$(T) bundle_17_list         0 "" $(BUNDLE) list mybionic/0002

bundle_help:
	@$(T) bundle_help_00  1 $(NO_DEEP) $(BUNDLE)
	@$(T) bundle_help_01  0 $(NO_DEEP) $(BUNDLE) -h
	@$(T) bundle_help_02  0 $(NO_DEEP) $(BUNDLE) -h init
	@$(T) bundle_help_03  0 $(NO_DEEP) $(BUNDLE) -h edit
	@$(T) bundle_help_04  0 $(NO_DEEP) $(BUNDLE) -h blacklist
	@$(T) bundle_help_05  0 $(NO_DEEP) $(BUNDLE) -h black
	@$(T) bundle_help_06  0 $(NO_DEEP) $(BUNDLE) -h meta
	@$(T) bundle_help_07  0 $(NO_DEEP) $(BUNDLE) -h show
	@$(T) bundle_help_08  0 $(NO_DEEP) $(BUNDLE) -h list
	@$(T) bundle_help_09  0 $(NO_DEEP) $(BUNDLE) -h ls
	@$(T) bundle_help_10  0 $(NO_DEEP) $(BUNDLE) -h seal
	@$(T) bundle_help_11  0 $(NO_DEEP) $(BUNDLE) -h apply
	@$(T) bundle_help_12  0 $(NO_DEEP) $(BUNDLE) -h clone
	@$(T) bundle_help_13  0 $(NO_DEEP) $(BUNDLE) -h bundles
	@$(T) bundle_help_14  0 $(NO_DEEP) $(BUNDLE) -h lsb
	@$(T) bundle_help_15  0 $(NO_DEEP) $(BUNDLE) -h update-repos-config
	@$(T) bundle_help_16  0 $(NO_DEEP) $(BUNDLE) -h repos
	@$(T) bundle_help_17  2 $(NO_DEEP) $(BUNDLE) -h invalid-cmd
  


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

