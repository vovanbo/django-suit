import $ from 'jquery';


function getPadding($tr) {
    return parseInt($tr.find('th:first').css('padding-left'));
}

function findWithChildren($tr) {
    var padding = getPadding($tr);
    return $tr.nextUntil(function () {
        return getPadding($(this)) <= padding
    }).andSelf();
}

export class Suit {
    // Register callbacks to perform after inline has been added
    after_inline() {
        const functions = {};
        const register = (fn_name, fn_callback) => {
            functions[fn_name] = fn_callback;
        };

        const run = (inline_prefix, row) => {
            for (const fn_name in functions) {
                functions[fn_name](inline_prefix, row);
            }
        };

        return {
            register,
            run
        };
    }

    ListActionsToggle() {
        let $topActions;

        const init = () => {
            $(document).ready(() => {
                $topActions = $('.results').parent().find('.actions').eq(0);
                if (!$topActions.length)
                    return;

                $("tr input.action-select, #action-toggle").on('click', checkIfSelected);
            });
        };

        const checkIfSelected = () => {
            if ($('tr.selected').length) {
                $topActions.slideDown('fast');
            } else {
                $topActions.slideUp('fast');
            }
        };

        return {
            init
        }
    }

    FixedBar() {
        let didScroll = false;
        let $fixedItem;
        let $fixedItemParent;
        let $win;
        let itemOffset;
        const extraOffset = 0;
        let fixed = false;

        function init(selector) {
            $fixedItem = $(selector || '.submit-row');
            if (!$fixedItem.length)
                return;

            $fixedItemParent = $fixedItem.parents('form');
            itemOffset = $fixedItem.offset();
            $win = $(window);
            window.onscroll = onScroll;
            window.onresize = onScroll;
            onScroll();

            setInterval(() => {
                if (didScroll) {
                    didScroll = false;
                }
            }, 200);
        }

        function onScroll() {
            didScroll = true;

            const itemHeight = $fixedItem.height();
            const scrollTop = $win.scrollTop();

            if (scrollTop + $win.height() - itemHeight - extraOffset < itemOffset.top) {
                if (!fixed) {
                    $fixedItem.addClass('fixed');
                    $fixedItemParent.addClass('fixed').css('padding-bottom', `${itemHeight}px`);
                    fixed = true;
                }
            } else {
                if (fixed) {
                    $fixedItem.removeClass('fixed');
                    $fixedItemParent.removeClass('fixed').css('padding-bottom', '');
                    fixed = false;
                }
            }
        }

        return {
            init
        }
    }
}

const suit = new Suit();
window.Suit = Suit;


/**
 * Avoids double-submit issues in the change_form.
 */
$.fn.suitFormDebounce = function () {
    const $form = $(this);
    const $saveButtons = $form.find('.submit-row button, .submit-row input[type=button], .submit-row input[type=submit]');
    let submitting = false;

    $form.submit(() => {
        if (submitting) {
            return false;
        }

        submitting = true;
        $saveButtons.addClass('disabled');

        setTimeout(() => {
            $saveButtons.removeClass('disabled');
            submitting = false;
        }, 5000);
    });
};

/**
 * Content tabs
 */
$.fn.suitFormTabs = function () {

    const $tabs = $(this);
    const tabPrefix = $tabs.data('tab-prefix');
    if (!tabPrefix)
        return;

    const $tabLinks = $tabs.find('a');

    function tabContents($link) {
        return $(`.${tabPrefix}-${$link.attr('href').replace('#', '')}`);
    }

    function activateTabs() {
        // Init tab by error, by url hash or init first tab
        if (window.location.hash) {
            let foundError;
            $tabLinks.each(function () {
                const $link = $(this);
                if (tabContents($link).find('.error, .errorlist').length !== 0) {
                    $link.addClass('has-error');
                    $link.trigger('click');
                    foundError = true;
                }
            });
            !foundError && $($tabs).find(`a[href=\\${window.location.hash}]`).click();
        } else {
            $tabLinks.first().trigger('click');
        }
    }

    $tabLinks.click(function () {
        const $link = $(this);

        const showEvent = $.Event('shown.suit.tab', {
            relatedTarget: $link,
            tab: $link.attr('href').replace('#', '')
        });

        $link.parent().parent().find('.active').removeClass('active');
        $link.addClass('active');
        $(`.${tabPrefix}`).removeClass('show').addClass('hidden-xs-up');
        tabContents($link).removeClass('hidden-xs-up').addClass('show');
        $link.trigger(showEvent);
    });

    activateTabs();
};


/* Characters count for CharacterCountTextarea */
$.fn.suitCharactersCount = function () {
    const $elements = $(this);

    if (!$elements.length)
        return;

    $elements.each(function () {
        const $el = $(this);
        const $countEl = $('<div class="suit-char-count"></div>');
        $el.after($countEl);
        $el.on('keyup', e => {
            updateCount($(e.currentTarget));
        });
        updateCount($el);
    });

    function updateCount($el) {
        const maxCount = $el.data('suit-maxcount');
        const twitterCount = $el.data('suit-twitter-count');
        const value = $el.val();
        const len = twitterCount ? getTweetLength(value) : value.length;
        let count = maxCount ? maxCount - len : len;
        if (count < 0)
            count = `<span class="text-danger">${count}</span>`;

        $el.next().first().html(count);
    }

    function getTweetLength(input) {
        let tmp = "";
        for (let i = 0; i < 23; i++) {
            tmp += "o"
        }
        return input.replace(/(http:\/\/[\S]*)/g, tmp).length;
    }
};


/**
 * Search filters - submit only changed fields
 */
$.fn.suitSearchFilters = function () {
    $(this).change(function () {
        const $field = $(this);
        const $option = $field.find('option:selected');
        const select_name = $option.data('name');
        if (select_name) {
            $field.attr('name', select_name);
        } else {
            $field.removeAttr('name');
        }
        // Handle additional values for date filters
        let additional = $option.data('additional');
        console.log($field, additional);
        if (additional) {
            const hiddenId = `${$field.data('name')}_add`;
            let $hidden = $(`#${hiddenId}`);
            if (!$hidden.length) {
                $hidden = $('<input/>').attr('type', 'hidden').attr('id', hiddenId);
                $field.after($hidden);
            }
            additional = additional.split('=');
            $hidden.attr('name', additional[0]).val(additional[1])
        }
    });
    $(this).trigger('change');
};


$.fn.suit_list_sortable = function () {
    const $inputs = $(this);
    if (!$inputs.length)
        return;

    // Detect if this is normal or mptt table
    const mptt_table = $inputs.first().closest('table').hasClass('table-mptt');

    function performMove($arrow, $row) {
        let $next;
        let $prev;

        $row.closest('table').find('tr.selected').removeClass('selected');
        if (mptt_table) {
            const padding = getPadding($row);
            const $rows_to_move = findWithChildren($row);
            if ($arrow.data('dir') === 'down') {
                $next = $rows_to_move.last().next();
                if ($next.length && getPadding($next) === padding) {
                    const $after = findWithChildren($next).last();
                    if ($after.length) {
                        $rows_to_move.insertAfter($after).addClass('selected');
                    }
                }
            } else {
                $prev = $row.prevUntil(function () {
                    return getPadding($(this)) <= padding
                }).andSelf().first().prev();
                if ($prev.length && getPadding($prev) === padding) {
                    $rows_to_move.insertBefore($prev).addClass('selected')
                }
            }
        } else {
            if ($arrow.data('dir') === 'down') {
                $next = $row.next();
                if ($next.is(':visible') && $next.length) {
                    $row.insertAfter($next).addClass('selected')
                }
            } else {
                $prev = $row.prev();
                if ($prev.is(':visible') && $prev.length) {
                    $row.insertBefore($prev).addClass('selected')
                }
            }
        }
        markLastInline($row.parent());
    }

    function onArrowClick(e) {
        const $sortable = $(this);
        const $row = $sortable.closest(
            $sortable.hasClass('sortable-stacked') ? 'div.inline-related' : 'tr'
        );
        performMove($sortable, $row);
        e.preventDefault();
    }

    function createLink(text, direction, on_click_func, is_stacked) {
        return $('<a/>').attr('href', '#')
            .addClass(`sortable sortable-${direction}${is_stacked ? ' sortable-stacked' : ''}`)
            .attr('data-dir', direction).html(text)
            .on('click', on_click_func);
    }

    function markLastInline($rowParent) {
        $rowParent.find(' > .last-sortable').removeClass('last-sortable');
        $rowParent.find('tr.form-row:visible:last').addClass('last-sortable');
    }

    let $lastSortable;
    $inputs.each(function () {
        const $inline_sortable = $('<div class="inline-sortable"/>');
        const icon = '<span class="fa fa-lg fa-arrow-up"></span>';
        const $sortable = $(this);
        const is_stacked = $sortable.hasClass('suit-sortable-stacked');
        const $up_link = createLink(icon, 'up', onArrowClick, is_stacked);
        const $down_link = createLink(icon.replace('-up', '-down'), 'down', onArrowClick, is_stacked);

        if (is_stacked) {
            const $sortable_row = $sortable.closest('div.form-group');
            const $stacked_block = $sortable.closest('div.inline-related');
            const $links_span = $('<span/>').attr('class', 'stacked-inline-sortable');

            // Add arrows to header h3, move order input and remove order field row
            $links_span.append($up_link).append($down_link);
            $links_span.insertAfter($stacked_block.find('.inline_label'));
            $stacked_block.append($sortable);
            $sortable_row.remove();
        } else {
            $sortable.parent().append($inline_sortable);
            $inline_sortable.append($up_link);
            $inline_sortable.append($down_link);
            $lastSortable = $sortable;
        }
    });

    $lastSortable && markLastInline($lastSortable.closest('.form-row').parent());

    // Filters out unchanged checkboxes, selects and sortable field itself
    function filter_unchanged(i, input) {
        if (input.type === 'checkbox') {
            if (input.defaultChecked === input.checked) {
                return false;
            }
        } else if (input.type === 'select-one' || input.type === 'select-multiple') {
            const options = input.options;
            let option;
            for (let j = 0; j < options.length; j++) {
                option = options[j];
                if (option.selected && option.selected === option.defaultSelected) {
                    return false;
                }
            }
        } else if ($(input).hasClass('suit-sortable')) {
            if (input.defaultValue === input.value && input.value === 0) {
                return false;
            }
        }
        return true;
    }

    // Update input count right before submit
    if ($inputs && $inputs.length) {
        const $last_input = $inputs.last();
        const selector = $(this).selector;
        $($last_input[0].form).submit(e => {
            let i = 0;
            let value;
            // e.preventDefault();
            $(selector).each(function () {
                const $input = $(this);
                const fieldset_id = $input.attr('name').split(/-\d+-/)[0];
                // Check if any of new dynamic block values has been added
                const $set_block = $input.closest(`.dynamic-${fieldset_id}`);
                const $changed_fields = $set_block.find(":input[type!='hidden']:not(.suit-sortable)").filter(
                    function () {
                        return $(this).val() !== "";
                    }).filter(filter_unchanged);
                // console.log($changed_fields.length, $changed_fields);
                const is_changelist = !$set_block.length;
                if (is_changelist
                    || $set_block.hasClass('has_original')
                    || $changed_fields.serializeArray().length
                    // Since jQuery serialize() doesn't include type=file do additional check
                    || $changed_fields.find(":input[type='file']").addBack().length) {
                    value = i++;
                    $input.val(value);
                }
            });
        });
    }

    suit.after_inline.register('bind_sortable_arrows', (prefix, row) => {
        $(row).find('.suit-sortable').on('click', onArrowClick);
        markLastInline($(row).parent());
    });
};


$('.suit-sortable').suit_list_sortable();

$(document).on('formset:added', (e, row, prefix) => {
    suit.after_inline.run(prefix, row);
});
