SHELL := bash
BUNDLE := ../bin/bundle
BUNDLE_COMPOSE := ../bin/bundle-compose
REPREPRO := reprepro -b repo/target
APT_REPOS := apt-repos/bin/apt-repos -b .apt-repos
ifeq (no,$(shell test -x apt-repos/bin/apt-repos || echo no))
  APT_REPOS := apt-repos -b .apt-repos
endif

# describes which files from the repo-folder should be transferred to resources/*.res
REPO_RSYNC := rsync -a --delete
S_NO_REPOS := --exclude dists --exclude lists --exclude db --exclude pool
S_BUNDLE   := "$(S_NO_REPOS) --exclude bundles_file --exclude target"
S_EDIT     := "$(S_NO_REPOS) --exclude bundle --exclude bundles_file --exclude target"
S_CMD_ONLY := "$(S_NO_REPOS) --exclude bundle --exclude bundles_file --exclude target --exclude editor.*"
S_COMPOSE  := "$(S_NO_REPOS) --exclude bundle --exclude editor.*"

IS_GIT_TREE := (which git && git ls-files --error-unmatch) >/dev/null 2>&1
CONTINUE := true
ifeq (no,$(shell $(IS_GIT_TREE) || echo no))
  CONTINUE := exit 1
endif

#====================================================================
HR=echo "========================================================="
T = export GNUPGHOME=$(CURDIR)/.gnupg; \
    function testcase {\
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
          sed -i "s~$$pwdUrl~…TESTDIR…~; s~$$HOME~…HOME…~; s~$$USER~…USER…~;" $$(find resources/$$name.res -type f); \
          diff -u -r resources/$$name.ref resources/$$name.res || exit 1; \
        ) && echo "TEST OK: $$name" || { echo "TEST FAILED: $$name"; $(CONTINUE); }; \
        echo ""; $(HR); \
    }; testcase
#====================================================================


main: bundle_workflow_part1 bundle_compose_workflow_part1 bundle_workflow_part2 bundle_compose_workflow_part2 bundle_help bundle_compose_help git_diff_results

prepare: clean configure_gnupg export_targets

bundle_workflow_part1: prepare
	@$(eval sync := $(S_BUNDLE))
	@#columns: @$(T) testcase-name expRet sync cmd…
	@$(T) bundle_01_init         0 $(sync) $(BUNDLE) init mybionic --no-clean-commit
	@$(T) bundle_02_apply        0 $(sync) $(BUNDLE) apply mybionic/0001
	@$(T) bundle_03_edit         0 $(sync) $(BUNDLE) edit mybionic/0001
	@$(T) bundle_04_apply        0 $(sync) $(BUNDLE) apply mybionic/0001
	@$(T) bundle_05_meta         0 $(sync) $(BUNDLE) meta mybionic/0001
	@$(T) bundle_06_show         0 $(sync) $(BUNDLE) show mybionic/0001
	@$(T) bundle_06_list         0 $(sync) $(BUNDLE) list mybionic/0001
	@$(T) bundle_06_bundles      0 $(sync) $(BUNDLE) bundles mybionic
	@$(T) bundle_07_black        0 $(sync) $(BUNDLE) black mybionic/0001
	@$(T) bundle_08_apply        0 $(sync) $(BUNDLE) apply mybionic/0001
	@$(T) bundle_09_show         0 $(sync) $(BUNDLE) show mybionic/0001
	@$(T) bundle_10_edit_cancel  0 $(sync) $(BUNDLE) edit mybionic/0001
	@$(T) bundle_11_meta_cancel  0 $(sync) $(BUNDLE) meta mybionic/0001
	@$(T) bundle_12_black_cancel 0 $(sync) $(BUNDLE) black mybionic/0001

bundle_compose_workflow_part1: prepare bundle_workflow_part1
	@$(eval sync := $(S_COMPOSE))
	@#columns: @$(T) testcase-name expRet sync cmd…
	@$(T) bundle_compose_01_ub    0 $(sync) $(BUNDLE_COMPOSE) update-bundles --no-trac
	@$(T) bundle_compose_02_list  0 $(sync) $(BUNDLE_COMPOSE) list
	@$(T) bundle_compose_03_stage 0 $(sync) $(BUNDLE_COMPOSE) mark-for-stage test bundle:mybionic/0001
	@$(T) bundle_compose_04_stage 0 $(sync) $(BUNDLE_COMPOSE) mark-for-stage -f test bundle:mybionic/0001
	@$(T) bundle_compose_05_apply 0 $(sync) $(BUNDLE_COMPOSE) apply
	@$(T) bundle_compose_06_list  0 $(sync) $(BUNDLE_COMPOSE) list
	@$(T) bundle_compose_07_rrexp 0 $(S_CMD_ONLY) $(REPREPRO) export
	@$(T) bundle_compose_08_rrupd 0 $(S_CMD_ONLY) $(REPREPRO) --noskipold update
	@$(T) bundle_compose_09_alist 0 $(S_CMD_ONLY) $(APT_REPOS) list -s target: -r .
	@$(T) bundle_compose_10_stage 0 $(sync) $(BUNDLE_COMPOSE) mark-for-stage prod -c
	@$(T) bundle_compose_11_apply 0 $(sync) $(BUNDLE_COMPOSE) apply
	@$(T) bundle_compose_12_list  0 $(sync) $(BUNDLE_COMPOSE) list
	@$(T) bundle_compose_13_rrupd 0 $(S_CMD_ONLY) $(REPREPRO) --noskipold update
	@$(T) bundle_compose_14_alist 0 $(S_CMD_ONLY) $(APT_REPOS) list -s target: -r .

bundle_workflow_part2: prepare bundle_workflow_part1
	@$(eval sync := $(S_BUNDLE))
	@#columns: @$(T) testcase-name expRet sync cmd…
	@$(T) bundle_12o_edit        0 $(S_CMD_ONLY) $(BUNDLE) edit mybionic/0001
	@$(T) bundle_12p_seal_unapplied 1 $(S_CMD_ONLY) $(BUNDLE) seal mybionic/0001
	@$(T) bundle_12q_apply       0 $(S_CMD_ONLY) $(BUNDLE) apply mybionic/0001
	@$(T) bundle_12r_black       0 $(S_CMD_ONLY) $(BUNDLE) black mybionic/0001
	@$(T) bundle_12r_edit        0 $(S_CMD_ONLY) $(BUNDLE) edit mybionic/0001
	@$(T) bundle_12s_seal_unapplied 1 $(S_CMD_ONLY) $(BUNDLE) seal mybionic/0001
	@$(T) bundle_12t_apply       0 $(S_CMD_ONLY) $(BUNDLE) apply mybionic/0001
	@$(T) bundle_13_seal         0 $(sync) $(BUNDLE) seal mybionic/0001
	@$(T) bundle_14_edit         1 $(sync) $(BUNDLE) edit mybionic/0001
	@$(T) bundle_15_clone        0 $(sync) $(BUNDLE) clone mybionic/0001 --no-clean-commit
	@$(T) bundle_16_bundles      0 $(sync) $(BUNDLE) bundles
	@$(T) bundle_17_list         0 $(sync) $(BUNDLE) list mybionic/0002
	@$(T) bundle_18_apply        0 $(sync) $(BUNDLE) apply mybionic/0002
	@$(T) bundle_19_list         0 $(sync) $(BUNDLE) list mybionic/0002
	@$(T) bundle_20_meta         0 $(sync) $(BUNDLE) meta mybionic/0002

bundle_compose_workflow_part2: prepare bundle_compose_workflow_part1 bundle_workflow_part2
	rm repo/bundles_file
	@#columns: @$(T) testcase-name expRet sync cmd…
	@$(T) bundle_compose_20_ub    0 $(S_CMD_ONLY) $(BUNDLE_COMPOSE) update-bundles --no-trac
	@$(T) bundle_compose_21_list  0 $(S_CMD_ONLY) $(BUNDLE_COMPOSE) list
	@$(T) bundle_compose_22_bseal 0 $(S_BUNDLE)   $(BUNDLE) seal mybionic/0002
	@$(T) bundle_compose_23_ub    0 $(S_CMD_ONLY) $(BUNDLE_COMPOSE) update-bundles --no-trac
	@$(T) bundle_compose_24_list  0 $(S_CMD_ONLY) $(BUNDLE_COMPOSE) list
	@$(T) bundle_compose_25_apply 0 $(S_COMPOSE)  $(BUNDLE_COMPOSE) apply
	@$(T) bundle_compose_26_rrupd 0 $(S_CMD_ONLY) $(REPREPRO) --noskipold update
	@$(T) bundle_compose_27_init  0 $(S_EDIT)     $(BUNDLE) init mybionic --no-clean-commit
	@$(T) bundle_compose_28_edit  0 $(S_EDIT)     $(BUNDLE) edit mybionic/0003
	@$(T) bundle_compose_29_alist 0 $(S_CMD_ONLY) $(APT_REPOS) list -s target: -r .
	@$(T) bundle_compose_30_stage 0 $(S_COMPOSE)  $(BUNDLE_COMPOSE) mark-for-stage drop bundle:mybionic/0001 bundle:mybionic/0002 -f
	@$(T) bundle_compose_31_ub    0 $(S_COMPOSE)  $(BUNDLE_COMPOSE) update-bundles --no-trac
	@$(T) bundle_compose_32_list  0 $(S_COMPOSE)  $(BUNDLE_COMPOSE) list

bundle_help:
	@$(eval sync := $(S_CMD_ONLY))
	@#columns: @$(T) testcase-name expRet sync cmd…
	@$(T) bundle_help_00  1 $(sync) $(BUNDLE)
	@$(T) bundle_help_01  0 $(sync) $(BUNDLE) -h
	@$(T) bundle_help_02  0 $(sync) $(BUNDLE) -h init
	@$(T) bundle_help_03  0 $(sync) $(BUNDLE) -h edit
	@$(T) bundle_help_04  0 $(sync) $(BUNDLE) -h blacklist
	@$(T) bundle_help_05  0 $(sync) $(BUNDLE) -h black
	@$(T) bundle_help_06  0 $(sync) $(BUNDLE) -h meta
	@$(T) bundle_help_07  0 $(sync) $(BUNDLE) -h show
	@$(T) bundle_help_08  0 $(sync) $(BUNDLE) -h list
	@$(T) bundle_help_09  0 $(sync) $(BUNDLE) -h ls
	@$(T) bundle_help_10  0 $(sync) $(BUNDLE) -h seal
	@$(T) bundle_help_11  0 $(sync) $(BUNDLE) -h apply
	@$(T) bundle_help_12  0 $(sync) $(BUNDLE) -h clone
	@$(T) bundle_help_13  0 $(sync) $(BUNDLE) -h bundles
	@$(T) bundle_help_14  0 $(sync) $(BUNDLE) -h lsb
	@$(T) bundle_help_15  0 $(sync) $(BUNDLE) -h update-repos-config
	@$(T) bundle_help_16  0 $(sync) $(BUNDLE) -h repos
	@$(T) bundle_help_17  2 $(sync) $(BUNDLE) -h invalid-cmd

bundle_compose_help:
	@$(eval sync := $(S_CMD_ONLY))
	@#columns: @$(T) testcase-name expRet syncArgs cmd…
	@$(T) bundle_compose_help_00  1 $(sync) $(BUNDLE_COMPOSE)
	@$(T) bundle_compose_help_01  0 $(sync) $(BUNDLE_COMPOSE) -h
	@$(T) bundle_compose_help_02  0 $(sync) $(BUNDLE_COMPOSE) -h update-bundles
	@$(T) bundle_compose_help_03  0 $(sync) $(BUNDLE_COMPOSE) -h ub
	@$(T) bundle_compose_help_04  0 $(sync) $(BUNDLE_COMPOSE) -h mark-for-stage
	@$(T) bundle_compose_help_05  0 $(sync) $(BUNDLE_COMPOSE) -h mark
	@$(T) bundle_compose_help_06  0 $(sync) $(BUNDLE_COMPOSE) -h stage
	@$(T) bundle_compose_help_08  0 $(sync) $(BUNDLE_COMPOSE) -h ls
	@$(T) bundle_compose_help_09  0 $(sync) $(BUNDLE_COMPOSE) -h lsb
	@$(T) bundle_compose_help_10  0 $(sync) $(BUNDLE_COMPOSE) -h apply
	@$(T) bundle_compose_help_11  2 $(sync) $(BUNDLE_COMPOSE) -h invalid-cmd

export_targets:
	$(BUNDLE_COMPOSE) apply
	$(REPREPRO) -b repo/target export
	@$(HR)

configure_gnupg: export GNUPGHOME = $(CURDIR)/.gnupg
configure_gnupg:
	@echo "GNUPGHOME is set to $$GNUPGHOME"
	mkdir -p $$GNUPGHOME
	chmod 700 $$GNUPGHOME
	gpg --import .apt-repos/gpg/*
	@$(HR)

clean:
	rm -Rf repo
	rm -Rf resources/*.res
	rm -Rf .apt-repos/.apt-repos_cache
	rm -Rf .gnupg/
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

